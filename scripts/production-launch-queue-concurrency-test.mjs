import assert from 'node:assert/strict';
import http from 'node:http';
if (!process.env.TEST_API_PORT || !process.env.TEST_SESSION_COOKIE || !process.env.TEST_CSRF_TOKEN) throw new Error('Explicit isolated API/session variables are required.');
const apiPort = Number(process.env.TEST_API_PORT); const cookie = process.env.TEST_SESSION_COOKIE; const csrfToken = process.env.TEST_CSRF_TOKEN;

function request(method, path, cookie, body, extraHeaders = {}) {
  const payload = body === undefined ? undefined : JSON.stringify(body);
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: 'localhost', port: apiPort, method, path, headers: {
      ...(cookie ? { Cookie: cookie, 'x-csrf-token': csrfToken } : {}), ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {}), ...extraHeaders
    } }, res => { let data = ''; res.on('data', chunk => data += chunk); res.on('end', () => resolve({ status: res.statusCode, data, headers: res.headers })); });
    req.on('error', reject); if (payload) req.write(payload); req.end();
  });
}

const patients = [];
for (let index = 0; index < 5; index += 1) {
  const suffix = `${Date.now()}-${index}-${Math.random().toString(16).slice(2)}`;
  const response = await request('POST', '/patients', cookie, {
    medicalRecordNumber: `QC-${suffix}`, firstName: 'Isolated', lastName: `Queue${index}`,
    phone: `01${Math.floor(Math.random() * 1e9).toString().padStart(9, '0')}`
  }, { 'Idempotency-Key': `queue-patient-${suffix}` });
  assert.equal(response.status, 201, response.data);
  patients.push(JSON.parse(response.data).id);
}

const results = await Promise.all(patients.map((patientId, index) => request('POST', '/queue/check-in', cookie, {
  patientId, priority: 'routine', checkInMethod: 'Automated isolated concurrency test'
}, { 'Idempotency-Key': `queue-checkin-${Date.now()}-${index}-${Math.random()}` })));
assert.ok(results.every(result => result.status === 201), results.map(result => `${result.status}:${result.data}`).join('\n'));
const tickets = results.map(result => JSON.parse(result.data));
assert.equal(new Set(tickets.map(ticket => ticket.id)).size, 5, 'all concurrent actions must create distinct tickets');
assert.equal(new Set(tickets.map(ticket => ticket.queueNumber)).size, 5, 'concurrent queue numbers must be unique');
const sorted = tickets.map(ticket => ticket.queueNumber).sort((a, b) => a - b);
assert.deepEqual(sorted, Array.from({ length: 5 }, (_, index) => sorted[0] + index), 'concurrent queue numbers must be contiguous');
console.log('Real concurrent queue check-ins passed with unique contiguous numbers.');
