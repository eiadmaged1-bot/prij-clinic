import { execSync } from 'child_process';

console.log("Running first catalogue assertion capture...");
execSync('node scripts/verification.mjs', { stdio: 'inherit' });

console.log("Running second seed...");
execSync('npm run prisma:seed', { stdio: 'inherit' });

console.log("Running second catalogue assertion and idempotency comparison...");
execSync('node scripts/verification.mjs', { stdio: 'inherit' });
