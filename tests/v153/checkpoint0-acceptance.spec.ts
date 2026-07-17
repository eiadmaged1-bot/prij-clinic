import { test, expect } from "@playwright/test";
import { loginAsOwner } from "../v094/helpers";

test.describe("Checkpoint 0: Reception search runtime acceptance", () => {
  test("mocked search returns safe QA results and has correct layout", async ({ page }) => {
    // Intercept API search to return mock data
    await page.route("**/patients*", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          patients: [
            { id: "p1", firstName: "Fatma", lastName: "Ahmed Hassan", medicalRecordNumber: "MRN-001", phone: "01000000001", status: "active", patientType: "OBSTETRIC" },
            { id: "p2", firstName: "Christopher", lastName: "Jonathan Smith", medicalRecordNumber: "MRN-002", phone: "01000000002", status: "active", patientType: "GYNECOLOGY" },
            { id: "p3", firstName: "مريم", lastName: "عبد الرحمن", medicalRecordNumber: "MRN-003", phone: "01000000003", status: "active", patientType: "INFERTILITY" }
          ],
          pageInfo: { page: 1, limit: 20, hasMore: false, total: 3 }
        })
      });
    });

    const viewports = [
      { name: "desktop", width: 1440, height: 900 },
      { name: "mobile-portrait", width: 390, height: 844 },
      { name: "mobile-landscape", width: 844, height: 390 }
    ];

    let hydrationErrors: string[] = [];
    page.on('console', msg => {
      if (msg.text().includes('Hydration') || msg.text().includes('Minified React error #418')) {
        hydrationErrors.push(msg.text());
      }
    });

    for (const vp of viewports) {
      await page.setViewportSize(vp);
      await loginAsOwner(page);
      await page.goto("http://localhost:3000/reception/check-in", { waitUntil: "networkidle" });
      
      const searchInput = page.getByLabel('Search patient').or(page.getByPlaceholder(/Name, phone|search|ابحث/i));
      // wait for it
      await searchInput.waitFor();
      await searchInput.fill("01000");
      await page.waitForTimeout(500); // wait for debounce
      
      const results = page.locator('.patient-search-card, .patient-list-card, tr').filter({ hasText: /MRN-/ });
      await expect(results).toHaveCount(3);
      
      // Select targets
      const first = results.nth(0).getByRole('button', { name: /select|open|queue|addToQueue/i }).first();
      const middle = results.nth(1).getByRole('button', { name: /select|open|queue|addToQueue/i }).first();
      const last = results.nth(2).getByRole('button', { name: /select|open|queue|addToQueue/i }).first();
      
      await expect(first).toBeVisible();
      await expect(middle).toBeVisible();
      await expect(last).toBeVisible();
      
      // overflow check
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `Overflow detected on ${vp.name}`).toBeLessThanOrEqual(2);
      
      // Screenshot
      await page.screenshot({ path: `test-results/reception-search-${vp.name}.png`, fullPage: true });
    }
    
    expect(hydrationErrors.length, "Hydration errors detected").toBe(0);
  });
});

test.describe("Checkpoint 0: Queue-number runtime acceptance", () => {
  test("mocked queue shows correct positions", async ({ page }) => {
    await page.route("**/clinic/dashboard*", async route => {
      await route.fulfill({ status: 200, json: {} });
    });
    await page.route("**/orders*", async route => {
      await route.fulfill({ status: 200, json: [] });
    });
    await page.route("**/invoices*", async route => {
      await route.fulfill({ status: 200, json: [] });
    });
    await page.route("**/queue/today*", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          queueTickets: [
            { id: "q1", patientId: "p1", queueNumber: 11, status: "called", priority: "normal", patient: { firstName: "P1" } },
            { id: "q2", patientId: "p2", queueNumber: 12, status: "waiting", priority: "normal", patient: { firstName: "P2" } },
            { id: "q3", patientId: "p3", queueNumber: 14, status: "waiting", priority: "normal", patient: { firstName: "P3" } },
            { id: "q4", patientId: "p4", queueNumber: 10, status: "completed", priority: "normal", patient: { firstName: "P4" } },
            { id: "q5", patientId: "p5", queueNumber: 13, status: "cancelled", priority: "normal", patient: { firstName: "P5" } },
          ],
          appointments: [], invoices: [], orders: []
        })
      });
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    await loginAsOwner(page);
    await page.goto("http://localhost:3000/queue", { waitUntil: "networkidle" });
    
    // Check ticket 12 (Position 1)
    const ticket12 = page.locator('article.data-row.dense').filter({ hasText: 'P2' });
    await expect(ticket12).toContainText("12");
    await expect(ticket12).toContainText("1");
    
    // Check ticket 14 (Position 2)
    const ticket14 = page.locator('article.data-row.dense').filter({ hasText: 'P3' });
    await expect(ticket14).toContainText("14");
    await expect(ticket14).toContainText("2");
    
    // Check ticket 11 (Position 3, status called)
    const ticket11 = page.locator('article.data-row.dense').filter({ hasText: 'P1' });
    await expect(ticket11).toContainText("11");
    await expect(ticket11).toContainText("3");
    
    await page.screenshot({ path: `test-results/queue-number-mocked.png`, fullPage: true });
  });
});

test.describe("Checkpoint 0: Deleted legacy workflow verification", () => {
  test("ActiveVisitWorkspace provides all unified routing", async ({ page }) => {
    await page.route("**/api/backend/patients/*/doctor-visit/current*", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ encounter: { id: "enc1", status: "draft", patientId: "p1" }, patient: { id: "p1", name: "Patient 1" } })
      });
    });
    // Verify all module tabs exist
    await loginAsOwner(page);
    await page.goto("http://localhost:3000/patients/p1/visits/enc1", { waitUntil: "networkidle" });
    
    const tabs = ["Encounter", "Complaint", "History", "Examination", "Impression", "Prescription", "Investigations", "Ultrasound", "Follow-up", "Finish / Print"];
    for (const tab of tabs) {
      await expect(page.getByRole("link", { name: tab, exact: true })).toBeVisible();
    }
  });
});
