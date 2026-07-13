import { test, expect } from '@playwright/test';

test('login page renders', async ({ page }) => {
  await page.goto('/login');

  // Verify that the login form is visible.
  // The login page might have a title or specific elements.
  await expect(page.locator('form')).toBeVisible();

  // It should also have an email/identifier field and password field
  await expect(page.locator('input[type="password"]')).toBeVisible();
});
