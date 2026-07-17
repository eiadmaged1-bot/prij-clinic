import { chromium, expect } from '@playwright/test';

async function globalSetup() {
  const browser = await chromium.launch();
  
  // Owner setup
  const ownerContext = await browser.newContext();
  const ownerPage = await ownerContext.newPage();
  await ownerPage.goto('http://localhost:3000/login');
  await ownerPage.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await ownerPage.getByLabel(/staff id or email/i).fill(process.env.DEMO_OWNER_LOGIN);
  await ownerPage.getByLabel(/password/i).fill(process.env.DEMO_OWNER_PASSWORD);
  await ownerPage.getByRole('button', { name: /^sign in$/i }).click();
  await ownerPage.waitForURL(/\/(dashboard|owner-control|doctor|reception)$/);
  await ownerContext.storageState({ path: '.auth/owner.json' });
  
  // Doctor setup
  const doctorContext = await browser.newContext();
  const doctorPage = await doctorContext.newPage();
  await doctorPage.goto('http://localhost:3000/login');
  await doctorPage.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await doctorPage.getByLabel(/staff id or email/i).fill(process.env.DEMO_DOCTOR_LOGIN);
  await doctorPage.getByLabel(/password/i).fill(process.env.DEMO_DOCTOR_PASSWORD);
  await doctorPage.getByRole('button', { name: /^sign in$/i }).click();
  await doctorPage.waitForURL(/\/(dashboard|owner-control|doctor|reception)$/);
  await doctorContext.storageState({ path: '.auth/doctor.json' });

  await browser.close();
}

export default globalSetup;

globalSetup().catch(console.error);
