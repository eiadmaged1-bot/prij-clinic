import * as http from 'http';
import * as assert from 'assert';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

console.log('Running production-launch-idempotency-safety-test.mjs...');

const prisma = new PrismaClient();
if (!process.env.TEST_API_PORT || !process.env.TEST_SESSION_COOKIE || !process.env.TEST_CSRF_TOKEN || !process.env.TEST_USER_ID) throw new Error('Explicit isolated API/session variables are required.');
const apiPort = Number(process.env.TEST_API_PORT); const testCookie = process.env.TEST_SESSION_COOKIE; const csrfToken = process.env.TEST_CSRF_TOKEN;

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

function generateRandomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function canonicalizePayload(payload) {
  if (payload === null || payload === undefined) {
    return '';
  }
  if (typeof payload !== 'object') {
    return String(payload);
  }
  if (Array.isArray(payload)) {
    return `[${payload.map((item) => canonicalizePayload(item)).join(',')}]`;
  }
  const keys = Object.keys(payload)
    .filter((key) => payload[key] !== undefined)
    .sort();
  const properties = keys.map((key) => {
    return `"${key}":${canonicalizePayload(payload[key])}`;
  });
  return `{${properties.join(',')}}`;
}

function hashString(val) {
  return crypto.createHash('sha256').update(val, 'utf8').digest('hex');
}
function hashPayload(val) {
  return hashString(canonicalizePayload(val));
}

async function testIdempotencySafety() {
  console.log('1. Use an explicitly provisioned synthetic session');
  const cookie = testCookie;
  const sessionUser = await prisma.user.findUniqueOrThrow({ where: { id: process.env.TEST_USER_ID } });

  console.log('2. Manually insert a FRESH stuck IN_PROGRESS idempotency record');
  const freshKey = 'test-fresh-' + Date.now();
  const payload = {
    medicalRecordNumber: 'IDEM-F' + generateRandomString(4),
    firstName: 'FreshTest',
    lastName: 'Patient',
    phone: '010' + generateRandomString(8)
  };
  
  await prisma.idempotencyRecord.create({
    data: {
      userId: sessionUser.id,
      scopeKey: sessionUser.branchId || 'GLOBAL',
      operation: 'patient.create',
      keyHash: hashString(freshKey),
      requestHash: hashPayload(payload),
      status: 'IN_PROGRESS',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 3600 * 1000)
    }
  });

  const body1 = JSON.stringify(payload);
  const req1 = await request({
    hostname: 'localhost',
    port: apiPort,
    path: '/patients',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body1),
      'Cookie': cookie,
      'x-csrf-token': csrfToken,
      'Idempotency-Key': freshKey
    }
  }, body1);

  assert.strictEqual(req1.res.statusCode, 409, 'Expected 409 Conflict for fresh IN_PROGRESS record, got: ' + req1.data);
  console.log('Got 409 with message:', req1.data);
  assert.ok(req1.data.includes('Operation is currently in progress'), 'Expected in progress message');
  console.log('-> Fresh IN_PROGRESS was safely rejected.');

  console.log('3. Manually insert a STALE stuck IN_PROGRESS idempotency record (6 minutes old)');
  const staleKey = 'test-stale-' + Date.now();
  const payload2 = {
    medicalRecordNumber: 'IDEM-' + generateRandomString(6),
    firstName: 'StaleTest',
    lastName: 'Patient',
    phone: '010' + generateRandomString(8)
  };

  await prisma.idempotencyRecord.create({
    data: {
      userId: sessionUser.id,
      scopeKey: sessionUser.branchId || 'GLOBAL',
      operation: 'patient.create',
      keyHash: hashString(staleKey),
      requestHash: hashPayload(payload2),
      status: 'IN_PROGRESS',
      createdAt: new Date(Date.now() - 6 * 60 * 1000), // 6 mins ago
      expiresAt: new Date(Date.now() + 24 * 3600 * 1000)
    }
  });

  const body2 = JSON.stringify(payload2);
  const req2 = await request({
    hostname: 'localhost',
    port: apiPort,
    path: '/patients',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body2),
      'Cookie': cookie,
      'x-csrf-token': csrfToken,
      'Idempotency-Key': staleKey
    }
  }, body2);

  assert.strictEqual(req2.res.statusCode, 201, 'Expected 201 Created for stale IN_PROGRESS record recovery');
  console.log('-> Stale IN_PROGRESS was safely recovered and processed.');
  
  await prisma.$disconnect();
  console.log('Idempotency safety tests passed!');
}

testIdempotencySafety().catch(err => {
  console.error('Test failed:', err);
  prisma.$disconnect();
  process.exit(1);
});
