import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import http from 'node:http';
import { PrismaClient } from '@prisma/client';

if (process.argv.length !== 2 || !process.env.DATABASE_URL || !process.env.TEST_API_PORT) {
  console.error('DATABASE_URL and TEST_API_PORT are required; flags are not accepted.'); process.exit(2);
}
const url = new URL(process.env.DATABASE_URL); const databaseName = decodeURIComponent(url.pathname.slice(1));
if (!databaseName.includes('_test_part_h_')) { console.error('Refusing non-Part-H database.'); process.exit(2); }
console.log(`database name: ${databaseName}`); console.log('host classification: isolated test host'); console.log(`schema: ${url.searchParams.get('schema') || 'public'}`); console.log('disposable: yes');
const port = Number(process.env.TEST_API_PORT); const prisma = new PrismaClient();

function request(method, path, cookie, body) {
  const payload = body === undefined ? undefined : JSON.stringify(body);
  const csrf = /(?:^|;\s*)csrf-token=([^;]+)/.exec(cookie ?? '')?.[1];
  return new Promise((resolve, reject) => { const req = http.request({ hostname: '127.0.0.1', port, method, path, headers: {
    ...(cookie ? { Cookie: cookie } : {}), ...(csrf ? { 'x-csrf-token': csrf } : {}), ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {})
  } }, res => { let data=''; res.on('data', c => data += c); res.on('end', () => resolve({ status: res.statusCode, data })); }); req.on('error', reject); if(payload) req.write(payload); req.end(); });
}
async function sessionFor(userId) { const raw=crypto.randomBytes(32).toString('base64url'); const csrf=crypto.randomBytes(24).toString('base64url'); await prisma.authSession.create({ data:{ userId, sessionTokenHash:crypto.createHash('sha256').update(raw).digest('hex'), expiresAt:new Date(Date.now()+3600000) } }); return `prij_clinic_session=${raw}; csrf-token=${csrf}`; }

try {
  assert.equal((await request('GET','/health/live')).status, 200, 'API must boot and expose liveness');
  const baseBranch = await prisma.branch.findFirstOrThrow({ orderBy:{ createdAt:'asc' } });
  const otherBranch = await prisma.branch.create({ data:{ name:'Part H Other Branch', code:`PH-${Date.now()}` } });
  const receptionistRole = await prisma.role.findUniqueOrThrow({ where:{ name:'Receptionist' } });
  const receptionist = await prisma.user.create({ data:{ email:`part-h-reception-${Date.now()}@invalid.local`, loginId:`part-h-reception-${Date.now()}`, displayName:'Part H Reception', status:'active', branchId:baseBranch.id, passwordHash:null, userRoles:{ create:{ roleId:receptionistRole.id, branchId:baseBranch.id } } } });
  const cookie = await sessionFor(receptionist.id); const suffix=Date.now(); const uniqueDigits=String(suffix).slice(-8);
  const englishPhone=`010${uniqueDigits}`; const arabicPhone=`015${uniqueDigits}`;
  const fixtures = await Promise.all([
    prisma.patient.create({ data:{ branchId:baseBranch.id, medicalRecordNumber:`PH-MRN-${suffix}`, firstName:'Alina', lastName:'Boundary', phone:englishPhone, createdByUserId:receptionist.id } }),
    prisma.patient.create({ data:{ branchId:baseBranch.id, medicalRecordNumber:`PH-AR-${suffix}`, firstName:'ليلى', lastName:'اختبار', phone:arabicPhone, createdByUserId:receptionist.id } }),
    prisma.patient.create({ data:{ branchId:otherBranch.id, medicalRecordNumber:`PH-OTHER-${suffix}`, firstName:'Alina', lastName:'OtherBranch', phone:englishPhone } })
  ]);
  for (const [query, expectedId] of [[`PH-MRN-${suffix}`,fixtures[0].id],[englishPhone,fixtures[0].id],['Ali',fixtures[0].id],['ليل',fixtures[1].id]]) {
    const response=await request('GET',`/patients?q=${encodeURIComponent(query)}`,cookie); assert.equal(response.status,200,response.data); const body=JSON.parse(response.data); assert.ok(Array.isArray(body.patients)); assert.ok(body.patients.some(row=>row.id===expectedId)); assert.ok(!body.patients.some(row=>row.id===fixtures[2].id),'branch isolation must be server-side'); assert.ok(body.patients.length<=25);
  }
  const unauth=await request('GET','/patients?q=Ali'); assert.equal(unauth.status,401);
  const createBody={ medicalRecordNumber:`PH-NEW-${suffix}`, firstName:'Synthetic', lastName:'Registration', phone:`011${String(suffix).slice(-8)}` };
  const created=await request('POST','/patients',cookie,createBody); assert.equal(created.status,201,created.data); assert.ok(JSON.parse(created.data).id);
  const duplicate=await request('GET',`/patients/duplicate-candidates?phone=${encodeURIComponent(fixtures[0].phone)}`,cookie); assert.equal(duplicate.status,200,duplicate.data); assert.ok(JSON.parse(duplicate.data).candidates.some(candidate=>candidate.patientId===fixtures[0].id));
  const concurrentBody={ medicalRecordNumber:`PH-RACE-${suffix}`, firstName:'Concurrent', lastName:'Registration', phone:`012${String(suffix).slice(-8)}` };
  const race=await Promise.all([request('POST','/patients',cookie,concurrentBody),request('POST','/patients',cookie,concurrentBody)]); assert.equal(race.filter(row=>row.status===201).length,1); assert.equal(await prisma.patient.count({where:{medicalRecordNumber:concurrentBody.medicalRecordNumber}}),1);
  console.log('Patient module boot, search, scope, registration, duplicate, concurrency, envelope, and authorization behavior passed.');
} finally { await prisma.$disconnect(); }
