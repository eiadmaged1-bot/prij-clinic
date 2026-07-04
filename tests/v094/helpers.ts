import { expect, type Page, test } from "@playwright/test";

type DemoAccount = {
  label: string;
  identifier: string;
  password: string;
  required: boolean;
};

const demoPassword = process.env.DEMO_TEST_PASSWORD || "LocalDev123!";
const ownerIdentifier = process.env.DEMO_ADMIN_LOGIN || process.env.DEMO_OWNER_LOGIN || "eyad";
const ownerAccount: DemoAccount = {
  label: "owner",
  identifier: ownerIdentifier,
  password: process.env.DEMO_ADMIN_PASSWORD || process.env.DEMO_OWNER_PASSWORD || (ownerIdentifier === "eyad" ? "eyad" : demoPassword),
  required: true
};

const roleAccounts = {
  doctor: { label: "doctor", identifier: process.env.DEMO_DOCTOR_LOGIN || "demo.doctor@prij.local", password: demoPassword, required: false },
  receptionist: { label: "receptionist", identifier: process.env.DEMO_RECEPTIONIST_LOGIN || "demo.reception@prij.local", password: demoPassword, required: false },
  accountant: { label: "accountant", identifier: process.env.DEMO_ACCOUNTANT_LOGIN || "demo.accountant@prij.local", password: demoPassword, required: false },
  nurse: { label: "nurse", identifier: process.env.DEMO_NURSE_LOGIN || "demo.nurse@prij.local", password: demoPassword, required: false }
} satisfies Record<string, DemoAccount>;

export function getBaseUrl() {
  return (process.env.WEB_URL || process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

export async function loginAsOwner(page: Page) {
  await loginWithAccount(page, ownerAccount);
}

export async function loginAsDoctor(page: Page) {
  return loginWithAccount(page, roleAccounts.doctor);
}

export async function loginAsReceptionist(page: Page) {
  return loginWithAccount(page, roleAccounts.receptionist);
}

export async function loginAsAccountant(page: Page) {
  return loginWithAccount(page, roleAccounts.accountant);
}

export async function loginAsNurse(page: Page) {
  return loginWithAccount(page, roleAccounts.nurse);
}

async function loginWithAccount(page: Page, account: DemoAccount) {
  await page.context().clearCookies();
  await page.goto("/login");
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  const switchAccount = page.getByRole("button", { name: /log out and switch account/i });
  if (await switchAccount.isVisible().catch(() => false)) {
    await switchAccount.click();
  }
  await page.getByLabel(/staff id or email/i).fill(account.identifier);
  await page.getByLabel(/password/i).fill(account.password);
  await page.getByRole("button", { name: /^sign in$/i }).click();

  try {
    await page.waitForURL(/\/dashboard$/, { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: /dashboard|clinic home|today/i }).first()).toBeVisible();
    return true;
  } catch (error) {
    if (account.required) {
      throw new Error(`Required ${account.label} demo login failed for ${account.identifier}: ${String(error)}`);
    }
    test.info().annotations.push({
      type: "skip",
      description: `${account.label} demo login unavailable for ${account.identifier}; role-specific browser checks skipped.`
    });
    return false;
  }
}

export async function expectNoCrashText(page: Page) {
  const body = await visibleBodyText(page);
  const forbidden = [
    /Unhandled Runtime Error/i,
    /Application error/i,
    /stack trace/i,
    /TypeError:/i,
    /ReferenceError:/i,
    /SyntaxError:/i,
    /fetch failed/i,
    /ECONNREFUSED/i,
    /Internal Server Error/i
  ];
  for (const pattern of forbidden) {
    expect(body, `Visible crash text matched ${pattern}`).not.toMatch(pattern);
  }
}

export async function expectNoCodeLikeText(page: Page) {
  const body = await visibleBodyText(page);
  const forbidden = [
    /Prisma/i,
    /\bJWT\b/i,
    /schema\.prisma/i,
    /raw JSON/i,
    /\blocalhost\b/i,
    /\/api\//i,
    /source debug/i,
    /import raw payload/i,
    /sourceRowHash/i,
    /parser confidence/i,
    /official field dump/i,
    /price debug/i,
    /{\s*"[^"]+"\s*:/m
  ];
  for (const pattern of forbidden) {
    expect(body, `Visible code-like text matched ${pattern}`).not.toMatch(pattern);
  }
}

export async function expectNoMedicationCommerceText(page: Page) {
  const body = await visibleBodyText(page);
  const forbidden = [
    /\bcheckout\b/i,
    /\bcart\b/i,
    /\bbuy\b/i,
    /order now/i,
    /available stock/i,
    /pharmacy stock/i,
    /\bpurchase\b/i,
    /how to take/i,
    /take\s+\d+\s+times?\s+daily/i,
    /patient dosing/i,
    /generated from strength/i,
    /generated from form/i
  ];
  for (const pattern of forbidden) {
    expect(body, `Visible medication commerce or dosing text matched ${pattern}`).not.toMatch(pattern);
  }
}

export async function createDemoPatient(page: Page) {
  await page.goto("/patients/new");
  await expect(page.getByRole("heading", { name: /new patient file/i })).toBeVisible();

  await page.getByLabel(/first name/i).fill("QA");
  await page.getByLabel(/last name/i).fill("BrowserTest");
  await page.getByLabel(/^phone$/i).fill("01000000000");
  await page.getByLabel(/notes/i).fill("Automated browser QA fake demo patient only.");
  await page.getByRole("button", { name: /save and open patient file/i }).click();
  await page.waitForURL(/\/patients\/(?!new(?:$|[/?#]))[^/?#]+$/, { timeout: 20_000 });

  const patientId = page.url().match(/\/patients\/(?!new(?:$|[/?#]))([^/?#]+)/)?.[1];
  if (!patientId) {
    throw new Error(`Patient creation did not redirect to a patient workspace. Current URL: ${page.url()}`);
  }
  return patientId;
}

export async function openPatientWorkspace(page: Page, patientId?: string) {
  if (patientId) {
    await page.goto(`/patients/${patientId}`);
  } else {
    await page.goto("/patients");
    const firstPatientLink = page.locator('a[href^="/patients/"]').first();
    await expect(firstPatientLink).toBeVisible();
    await firstPatientLink.click();
  }
  await expect(page.getByRole("heading", { name: /QA BrowserTest|patient|opening patient/i }).first()).toBeVisible();
}

export async function checkVisibleTextOrSoftWarn(page: Page, text: string | RegExp) {
  try {
    await expect(page.getByText(text).first()).toBeVisible({ timeout: 3_000 });
  } catch {
    test.info().annotations.push({
      type: "warning",
      description: `Optional visible text not found: ${String(text)}`
    });
  }
}

export async function expectCleanPage(page: Page) {
  await expectNoCrashText(page);
  await expectNoCodeLikeText(page);
}

export async function visibleBodyText(page: Page) {
  await page.locator("body").waitFor({ state: "visible" });
  return (await page.locator("body").innerText()).replace(/\s+/g, " ").trim();
}
