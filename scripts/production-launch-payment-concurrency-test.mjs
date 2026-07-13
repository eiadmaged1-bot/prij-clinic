import assert from 'node:assert/strict';
import http from 'node:http';
if (!process.env.TEST_API_PORT || !process.env.TEST_SESSION_COOKIE || !process.env.TEST_CSRF_TOKEN) throw new Error('Explicit isolated API/session variables are required.');
const apiPort = Number(process.env.TEST_API_PORT); const cookie = process.env.TEST_SESSION_COOKIE; const csrfToken = process.env.TEST_CSRF_TOKEN;

function request(method, path, cookie, body, csrfToken) {
  const payload = body === undefined ? undefined : JSON.stringify(body);
  return new Promise((resolve, reject) => {
    const headers = {
      ...(cookie ? { Cookie: cookie } : {}),
      ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
      ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {})
    };
    const req = http.request({ hostname: 'localhost', port: apiPort, method, path, headers }, res => {
      let data = ''; res.on('data', chunk => data += chunk); res.on('end', () => resolve({ status: res.statusCode, data, headers: res.headers }));
    });
    req.on('error', reject); if (payload) req.write(payload); req.end();
  });
}


async function createInvoice(label) {
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const patient = await request('POST', '/patients', cookie, { medicalRecordNumber: `PAY-${suffix}`, firstName: 'Isolated', lastName: label, phone: `01${Math.floor(Math.random() * 1e9).toString().padStart(9, '0')}` }, csrfToken);
  assert.equal(patient.status, 201, patient.data);
  const invoice = await request('POST', '/billing/invoices', cookie, { patientId: JSON.parse(patient.data).id, items: [{ description: 'Concurrency test item', unitAmount: 1000, quantity: 1 }] }, csrfToken);
  assert.equal(invoice.status, 201, invoice.data);
  return JSON.parse(invoice.data).id;
}

async function pay(invoiceId, amount) {
  return request('POST', '/billing/payments', cookie, { invoiceId, amount: String(amount), method: 'cash', note: 'Automated isolated concurrency test' }, csrfToken);
}

const exactInvoice = await createInvoice('ExactConcurrency');
const exact = await Promise.all([pay(exactInvoice, 600), pay(exactInvoice, 400)]);
assert.deepEqual(exact.map(result => result.status).sort(), [201, 201], '600+400 must both commit');
const exactFinal = await request('GET', `/billing/invoices/${exactInvoice}`, cookie);
assert.equal(JSON.parse(exactFinal.data).amountPaid, '1000');
assert.equal(JSON.parse(exactFinal.data).status, 'paid');

const overInvoice = await createInvoice('OverpayConcurrency');
const over = await Promise.all([pay(overInvoice, 700), pay(overInvoice, 700)]);
assert.deepEqual(over.map(result => result.status).sort(), [201, 400], 'only one competing 700 payment may commit');
assert.match(over.find(result => result.status === 400).data, /PAYMENT_EXCEEDS_BALANCE/);
const overFinal = await request('GET', `/billing/invoices/${overInvoice}`, cookie);
assert.equal(JSON.parse(overFinal.data).amountPaid, '700');
assert.equal(JSON.parse(overFinal.data).status, 'partially_paid');
console.log('Payment concurrency 600+400 and 700+700 scenarios passed.');
