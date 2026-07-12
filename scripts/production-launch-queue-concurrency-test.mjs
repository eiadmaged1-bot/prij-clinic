import * as http from 'http';
import * as assert from 'assert';

function request(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve({ res, data }));
    });
    req.on('error', reject);
    if (body) {
      req.write(body);
    }
    req.end();
  });
}

async function testQueueConcurrency() {
  console.log('1. Login to get session');
  const loginBody = JSON.stringify({ identifier: 'eyad', password: 'eyad' });
  const loginRes = await request({
    hostname: 'localhost',
    port: 3001,
    path: '/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(loginBody) }
  }, loginBody);
  const setCookie = loginRes.res.headers['set-cookie'];
  const cookie = setCookie ? setCookie.map(c => c.split(';')[0]).join('; ') : '';

  console.log('2. Create a test patient');
  const rand = Date.now().toString().slice(-6);
  const patientBody = JSON.stringify({
    medicalRecordNumber: 'QTEST-' + rand,
    firstName: 'QueueTest',
    lastName: 'Patient',
    phone: '010' + rand + '12'
  });
  const patientRes = await request({
    hostname: 'localhost',
    port: 3001,
    path: '/patients',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(patientBody), 'Cookie': cookie, 'Idempotency-Key': 'qtest-' + rand }
  }, patientBody);
  const patientId = JSON.parse(patientRes.data).id;

  console.log('3. Add patient to queue');
  const queueBody = JSON.stringify({ patientId, priority: 'routine', checkInMethod: 'Walk-in' });
  const qRes = await request({
    hostname: 'localhost',
    port: 3001,
    path: '/queue/check-in',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(queueBody), 'Cookie': cookie }
  }, queueBody);
  console.log("Queue response:", qRes.statusCode, qRes.data);
  const ticketId = JSON.parse(qRes.data).id;
  assert.ok(ticketId, 'Queue ticket created');

  console.log('4. Attempt CONCURRENT status transition to "called" and "completed"');
  // Send both requests at exactly the same time
  const callResPromise = request({
    hostname: 'localhost',
    port: 3001,
    path: '/queue/' + ticketId + '/call',
    method: 'PATCH',
    headers: { 'Cookie': cookie }
  });
  
  const compResPromise = request({
    hostname: 'localhost',
    port: 3001,
    path: '/queue/' + ticketId + '/complete',
    method: 'PATCH',
    headers: { 'Cookie': cookie }
  });

  const [callRes, compRes] = await Promise.all([callResPromise, compResPromise]);
  console.log('Call Response Status:', callRes.res.statusCode, callRes.data);
  console.log('Complete Response Status:', compRes.res.statusCode, compRes.data);

  // One should succeed, the other MUST fail because they expect different previous statuses
  // Actually, they both expect different statuses!
  // call expects "waiting", complete expects "called".
  // So if they are sent concurrently, call should succeed, complete should FAIL!
  
  assert.strictEqual(callRes.res.statusCode, 200, 'Call should succeed (was waiting)');
  assert.strictEqual(compRes.res.statusCode, 400, 'Complete should fail because it was not called yet (race condition prevented)');
  
  console.log('Queue transition concurrency safety passed!');
}

testQueueConcurrency().catch(err => {
  console.error(err);
  process.exit(1);
});
