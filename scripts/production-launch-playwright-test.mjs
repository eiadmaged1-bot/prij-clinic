import { execSync } from 'node:child_process';
import assert from 'node:assert/strict';

console.log('--- Phase 11: Playwright Setup Test ---');

try {
  // We can just run the playwright test command
  console.log('Running playwright tests in apps/web...');
  execSync('npx playwright test --project=chromium', {
    cwd: 'apps/web',
    stdio: 'inherit'
  });
  console.log(' - Passed: Playwright smoke test completed successfully.');
} catch (error) {
  // Check if it's because the server is not running
  console.error('Playwright tests failed. Make sure the web server is running on port 3000.');
  console.error(error);
  process.exit(1);
}

console.log('--- Phase 11 Playwright Test Complete ---');
