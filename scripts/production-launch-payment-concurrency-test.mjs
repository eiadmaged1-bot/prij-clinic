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

async function testPaymentConcurrency() {
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

  console.log('2. Create a test patient for billing');
  const rand = Date.now().toString().slice(-6);
  const patientBody = JSON.stringify({
    medicalRecordNumber: 'BILL-' + rand,
    firstName: 'BillTest',
    lastName: 'Patient',
    phone: '010' + rand + '13'
  });
  const patientRes = await request({
    hostname: 'localhost',
    port: 3001,
    path: '/patients',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(patientBody), 'Cookie': cookie, 'Idempotency-Key': 'btest-' + rand }
  }, patientBody);
  const patientId = JSON.parse(patientRes.data).id;

  console.log('3. Create an invoice of 1000 EGP');
  const invoiceBody = JSON.stringify({
    patientId,
    items: [{ description: 'Consultation', unitAmount: 1000, quantity: 1 }]
  });
  const invRes = await request({
    hostname: 'localhost',
    port: 3001,
    path: '/billing/invoices',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(invoiceBody), 'Cookie': cookie }
  }, invoiceBody);
  console.log("Invoice Response:", invRes.statusCode, invRes.data);
  const invoiceId = JSON.parse(invRes.data).id;
  assert.ok(invoiceId, 'Invoice created');

  console.log('4. Attempt CONCURRENT payments of 100 EGP each (simulating a race condition)');
  
  // We need to bypass idempotency to actually test row-locking concurrency on the invoice!
  // We'll intentionally NOT provide Idempotency-Key header, or we can provide DIFFERENT keys.
  
  const createPaymentReq = (note) => {
    const payBody = JSON.stringify({ invoiceId, amount: '100', method: 'cash', note });
    return request({
      hostname: 'localhost',
      port: 3001,
      path: '/billing/payments',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payBody), 'Cookie': cookie } // No idempotency key to test true concurrency locking
    }, payBody);
  };

  const reqs = [
    createPaymentReq('Race 1'),
    createPaymentReq('Race 2'),
    createPaymentReq('Race 3'),
    createPaymentReq('Race 4'),
    createPaymentReq('Race 5')
  ];

  const results = await Promise.all(reqs);
  let successCount = 0;
  for (const res of results) {
    if (res.res.statusCode === 201) successCount++;
    else console.log('Payment failed:', res.data);
  }

  assert.strictEqual(successCount, 5, 'All 5 concurrent payments should succeed thanks to row-level locks');

  console.log('5. Verify final invoice balance is correct');
  const checkRes = await request({
    hostname: 'localhost',
    port: 3001,
    path: '/billing/invoices/' + invoiceId,
    method: 'GET',
    headers: { 'Cookie': cookie }
  });
  
  const finalInvoice = JSON.parse(checkRes.data);
  console.log(`Final amountPaid: ${finalInvoice.amountPaid}`);
  
  // 5 * 100 = 500
  assert.strictEqual(finalInvoice.amountPaid, '500', 'Amount paid must be exactly 500, avoiding lost updates');
  assert.strictEqual(finalInvoice.status, 'partially_paid');

  console.log('Payment row-level concurrency safety passed!');
}

testPaymentConcurrency().catch(err => {
  console.error(err);
  process.exit(1);
});
