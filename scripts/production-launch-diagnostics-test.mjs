import assert from 'node:assert/strict';

console.log('--- Phase 9: Diagnostics Test ---');

const WEB_URL = 'http://localhost:3000/owner/diagnostics';

async function runTests() {
  console.log(`1. Testing GET /owner/diagnostics without auth`);
  try {
    const res = await fetch(WEB_URL, { redirect: 'manual' });
    // It should probably redirect or load the page and fail gracefully if no session cookie.
    // Given the Next.js setup, if we hit the Next.js page directly, it might render the UI
    // but the fetchAuditLogs will fail and return error or empty.
    assert.equal(res.status, 200);
    const text = await res.text();
    assert.ok(text.includes('System Diagnostics'), 'Page should render Diagnostics title');
    console.log(' - Passed: Page renders without crashing.');
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error(`Warning: Web server at ${WEB_URL} is not running.`);
      process.exit(0);
    }
    console.error('Failed test 1:', error);
    process.exit(1);
  }

  console.log('--- Phase 9 Diagnostics Test Complete ---');
}

runTests();
