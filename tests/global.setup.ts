import { chromium } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

export default async function globalSetup() {
  const requiredVars = [
    'DEMO_OWNER_LOGIN',
    'DEMO_OWNER_PASSWORD',
    'DEMO_DOCTOR_LOGIN',
    'DEMO_DOCTOR_PASSWORD'
  ];

  for (const v of requiredVars) {
    const val = process.env[v];
    if (!val || val.includes('<') || val.includes('QA_') || val.trim() === '') {
      throw new Error(`FATAL: Required environment variable ${v} is missing or contains placeholder values.`);
    }
  }

  const authDir = path.join(process.cwd(), '.auth');
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  const browser = await chromium.launch();
  
  // Owner setup
  const ownerContext = await browser.newContext();
  const ownerPage = await ownerContext.newPage();
  await ownerPage.goto('http://localhost:3000/login');
  await ownerPage.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await ownerPage.getByLabel(/staff id or email/i).fill(process.env.DEMO_OWNER_LOGIN as string);
  await ownerPage.getByLabel(/password/i).fill(process.env.DEMO_OWNER_PASSWORD as string);
  await ownerPage.getByRole('button', { name: /^sign in$/i }).click();
  await ownerPage.waitForURL(/\/(dashboard|owner-control|doctor|reception)$/);
  await ownerContext.storageState({ path: '.auth/owner.json' });
  
  // Doctor setup
  const doctorContext = await browser.newContext();
  const doctorPage = await doctorContext.newPage();
  await doctorPage.goto('http://localhost:3000/login');
  await doctorPage.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await doctorPage.getByLabel(/staff id or email/i).fill(process.env.DEMO_DOCTOR_LOGIN as string);
  await doctorPage.getByLabel(/password/i).fill(process.env.DEMO_DOCTOR_PASSWORD as string);
  await doctorPage.getByRole('button', { name: /^sign in$/i }).click();
  await doctorPage.waitForURL(/\/(dashboard|owner-control|doctor|reception)$/);
  await doctorContext.storageState({ path: '.auth/doctor.json' });

  await browser.close();
}
