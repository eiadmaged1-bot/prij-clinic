import assert from 'node:assert/strict';
import http from 'node:http';
if (!process.env.TEST_API_PORT || !process.env.TEST_SESSION_COOKIE || !process.env.TEST_CSRF_TOKEN) throw new Error('Explicit isolated API/session variables are required.');
const apiPort = Number(process.env.TEST_API_PORT); const cookie = process.env.TEST_SESSION_COOKIE; const csrfToken = process.env.TEST_CSRF_TOKEN;

function request(method, path, cookie, body) {
  const payload = body === undefined ? undefined : JSON.stringify(body);
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: 'localhost', port: apiPort, method, path, headers: {
      ...(cookie ? { Cookie: cookie, 'x-csrf-token': csrfToken } : {}), ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {})
    } }, res => { let data = ''; res.on('data', chunk => data += chunk); res.on('end', () => resolve({ status: res.statusCode, data, headers: res.headers })); });
    req.on('error', reject); if (payload) req.write(payload); req.end();
  });
}

const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const patient = await request('POST', '/patients', cookie, { medicalRecordNumber: `QTR-${suffix}`, firstName: 'Isolated', lastName: 'Transition', phone: `01${Date.now().toString().slice(-9)}` });
assert.equal(patient.status, 201, patient.data);
const patientId = JSON.parse(patient.data).id;
const checkedIn = await request('POST', '/queue/check-in', cookie, { patientId, priority: 'routine', checkInMethod: 'Automated isolated test' });
assert.equal(checkedIn.status, 201, checkedIn.data);
const ticketId = JSON.parse(checkedIn.data).id;

const callResults = await Promise.all([
  request('PATCH', `/queue/${ticketId}/call`, cookie),
  request('PATCH', `/queue/${ticketId}/call`, cookie)
]);
assert.deepEqual(callResults.map(result => result.status).sort(), [200, 400], 'exactly one competing waiting->called transition must win');
const completeResults = await Promise.all([
  request('PATCH', `/queue/${ticketId}/complete`, cookie),
  request('PATCH', `/queue/${ticketId}/complete`, cookie)
]);
assert.deepEqual(completeResults.map(result => result.status).sort(), [200, 400], 'exactly one competing called->completed transition must win');
console.log('Real conditional queue transition races passed.');
