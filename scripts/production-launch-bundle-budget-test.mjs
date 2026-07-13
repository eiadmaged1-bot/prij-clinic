import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

if(process.argv.length!==2){console.error("This test accepts no flags.");process.exit(2);}
const nextRoot=path.resolve("apps/web/.next"),loadablePath=path.join(nextRoot,"react-loadable-manifest.json"),buildIdPath=path.join(nextRoot,"BUILD_ID");
if(!fs.existsSync(loadablePath)||!fs.existsSync(buildIdPath)){console.error("A successful production build is required before bundle verification.");process.exit(2);}
const loadable=JSON.parse(fs.readFileSync(loadablePath,"utf8"));const entries=Object.entries(loadable);const required=["timeline-components","visit-flow-components","panel-components","pregnancy-components"];
for(const name of required)assert.ok(entries.some(([key])=>key.includes(name)),`${name} is not represented by a lazy build chunk`);
const files=[...new Set(entries.filter(([key])=>required.some(name=>key.includes(name))).flatMap(([,value])=>value.files??[]))];const sizes=files.map(file=>({file,bytes:fs.statSync(path.join(nextRoot,file)).size}));
const appManifest=JSON.parse(fs.readFileSync(path.join(nextRoot,"app-build-manifest.json"),"utf8"));const patientRoute=Object.entries(appManifest.pages??{}).find(([route])=>route.includes("patients/[id]"));const initialFiles=patientRoute?.[1]??[];for(const lazyFile of files)assert.ok(!initialFiles.includes(lazyFile),`${lazyFile} leaked into the initial patient route chunk list`);
const initialBytes=initialFiles.filter(file=>fs.existsSync(path.join(nextRoot,file))).reduce((sum,file)=>sum+fs.statSync(path.join(nextRoot,file)).size,0);console.log(JSON.stringify({buildId:fs.readFileSync(buildIdPath,"utf8").trim(),patientInitialBytes:initialBytes,patientInitialFiles:initialFiles.length,lazyChunks:sizes}));console.log("Production build output confirms patient workspace domain chunks remain lazy.");
