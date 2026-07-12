import assert from "node:assert/strict";
import crypto from "node:crypto";
import http from "node:http";
import { PrismaClient } from "@prisma/client";

if (process.argv.length !== 2 || !process.env.DATABASE_URL || !process.env.TEST_API_PORT) { console.error("DATABASE_URL and TEST_API_PORT are required; flags are not accepted."); process.exit(2); }
const databaseUrl=new URL(process.env.DATABASE_URL), databaseName=decodeURIComponent(databaseUrl.pathname.slice(1));
if(!databaseName.includes("_test_part_h_")){console.error("Refusing non-Part-H database.");process.exit(2);}
console.log(`database name: ${databaseName}`);console.log("host classification: isolated test host");console.log(`schema: ${databaseUrl.searchParams.get("schema")||"public"}`);console.log("disposable: yes");
const prisma=new PrismaClient(), port=Number(process.env.TEST_API_PORT);
function request(path,cookie){return new Promise((resolve,reject)=>{const req=http.request({hostname:"127.0.0.1",port,path,headers:{Cookie:cookie}},res=>{let data="";res.on("data",chunk=>data+=chunk);res.on("end",()=>resolve({status:res.statusCode,body:JSON.parse(data||"null")}));});req.on("error",reject);req.end();});}
async function session(userId){const raw=crypto.randomBytes(32).toString("base64url");await prisma.authSession.create({data:{userId,sessionTokenHash:crypto.createHash("sha256").update(raw).digest("hex"),expiresAt:new Date(Date.now()+3600000)}});return `prij_clinic_session=${raw}`;}
async function role(name,permissionKeys){const row=await prisma.role.create({data:{name,description:`Part H ${name}`}});for(const key of permissionKeys){const permission=await prisma.permission.upsert({where:{key},create:{key,description:`Part H ${key}`},update:{}});await prisma.rolePermission.create({data:{roleId:row.id,permissionId:permission.id}});}return row;}
function compare(left,right){return Date.parse(right.dateTime)-Date.parse(left.dateTime)||left.type.localeCompare(right.type)||left.sourceId.localeCompare(right.sourceId);}

try{
  const ownerRole=await role("Owner",["patient.read"]), receptionistRole=await role("Receptionist",["patient.read"]);
  const branch=await prisma.branch.create({data:{name:"Part H Timeline Branch",code:`PHT-${Date.now()}`}}), otherBranch=await prisma.branch.create({data:{name:"Part H Other Timeline Branch",code:`PHO-${Date.now()}`}});
  const owner=await prisma.user.create({data:{email:`part-h-timeline-owner-${Date.now()}@invalid.local`,loginId:`part-h-timeline-owner-${Date.now()}`,displayName:"Part H Timeline Owner",status:"active",branchId:branch.id,passwordHash:null,userRoles:{create:{roleId:ownerRole.id,branchId:branch.id}}}});
  const receptionist=await prisma.user.create({data:{email:`part-h-timeline-reception-${Date.now()}@invalid.local`,loginId:`part-h-timeline-reception-${Date.now()}`,displayName:"Part H Timeline Reception",status:"active",branchId:branch.id,passwordHash:null,userRoles:{create:{roleId:receptionistRole.id,branchId:branch.id}}}});
  const patient=await prisma.patient.create({data:{branchId:branch.id,medicalRecordNumber:`PH-TL-${Date.now()}`,firstName:"PartH",lastName:"Timeline",createdByUserId:owner.id}}), otherPatient=await prisma.patient.create({data:{branchId:otherBranch.id,medicalRecordNumber:`PH-TL-O-${Date.now()}`,firstName:"Other",lastName:"Branch"}});
  const base=Date.now()-3600000;
  await prisma.appointment.createMany({data:Array.from({length:120},(_,index)=>({branchId:branch.id,patientId:patient.id,doctorId:owner.id,startAt:new Date(base-Math.floor(index/5)*60000),endAt:new Date(base-Math.floor(index/5)*60000+1800000),appointmentType:"Part H pagination"}))});
  await prisma.queueTicket.createMany({data:Array.from({length:5},(_,index)=>({branchId:branch.id,patientId:patient.id,queueNumber:index+1,queueDate:new Date(new Date(base).toISOString().slice(0,10)),visitType:"kashf",checkedInAt:new Date(base-index*60000)}))});
  const encounter=await prisma.encounter.create({data:{branchId:branch.id,patientId:patient.id,doctorId:owner.id,startedByUserId:owner.id,doctorDisplayNameSnapshot:"Part H Doctor",startedAt:new Date(base),createdAt:new Date(base),chiefComplaint:"Synthetic pagination fixture"}});
  await prisma.prescription.create({data:{patientId:patient.id,encounterId:encounter.id,doctorId:owner.id,createdAt:new Date(base)}});
  await prisma.investigationOrder.create({data:{patientId:patient.id,encounterId:encounter.id,doctorId:owner.id,createdAt:new Date(base)}});
  await prisma.patientDocument.create({data:{patientId:patient.id,branchId:branch.id,title:"Synthetic pagination document",documentType:"other",category:"administrative",createdAt:new Date(base)}});
  const invoice=await prisma.invoice.create({data:{branchId:branch.id,patientId:patient.id,invoiceNumber:`PH-TL-INV-${Date.now()}`,totalAmount:100,balanceAmount:50,createdAt:new Date(base)}});
  await prisma.payment.create({data:{branchId:branch.id,patientId:patient.id,invoiceId:invoice.id,method:"cash",amount:50,paidAt:new Date(base)}});
  const ownerCookie=await session(owner.id), receptionistCookie=await session(receptionist.id); let cursor=null, all=[], pages=0;
  do{const suffix=cursor?`&cursor=${encodeURIComponent(cursor)}`:"";const response=await request(`/patients/${patient.id}/timeline?limit=25${suffix}`,ownerCookie);assert.equal(response.status,200,JSON.stringify(response.body));assert.ok(response.body.items.length<=25);for(let index=1;index<response.body.items.length;index++)assert.ok(compare(response.body.items[index-1],response.body.items[index])<=0,"page ordering is unstable");all.push(...response.body.items);cursor=response.body.nextCursor;assert.equal(Boolean(cursor),response.body.hasMore);pages+=1;assert.ok(pages<10,"cursor did not terminate");}while(cursor);
  assert.ok(all.length>=131,`expected cross-source fixtures, received ${all.length}`);assert.equal(new Set(all.map(item=>item.id)).size,all.length,"duplicate event across pages");for(let index=1;index<all.length;index++)assert.ok(compare(all[index-1],all[index])<=0,"global ordering is unstable");
  const malformed=await request(`/patients/${patient.id}/timeline?cursor=not-a-cursor`,ownerCookie);assert.equal(malformed.status,400);assert.match(JSON.stringify(malformed.body),/PATIENT_TIMELINE_CURSOR_INVALID/);
  assert.equal((await request(`/patients/${otherPatient.id}/timeline`,receptionistCookie)).status,404,"branch isolation failed");
  const receptionTimeline=await request(`/patients/${patient.id}/timeline?limit=50`,receptionistCookie);assert.equal(receptionTimeline.status,200);const clinicalTypes=new Set(["encounter","prescription","investigation","investigation_result","gynecology","pregnancy","pregnancy_fetus","antenatal_visit","ultrasound"]);assert.ok(!receptionTimeline.body.items.some(item=>clinicalTypes.has(item.type)),"receptionist received clinical timeline data");
  const decoded=JSON.parse(Buffer.from((await request(`/patients/${patient.id}/timeline?limit=1`,ownerCookie)).body.nextCursor,"base64url").toString("utf8"));assert.deepEqual(Object.keys(decoded).sort(),["id","timestamp","type","v"]);assert.ok(!JSON.stringify(decoded).includes(patient.medicalRecordNumber));
  console.log(`Timeline pagination passed across ${pages} pages and ${all.length} events with stable ordering, branch scope, and receptionist filtering.`);
}finally{await prisma.$disconnect();}
