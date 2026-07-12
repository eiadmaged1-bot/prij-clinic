import assert from 'node:assert/strict';

console.log('--- Phase 4: Rate Limits Test ---');

if (!process.env.TEST_API_PORT) throw new Error('TEST_API_PORT is required.');
const API_URL = `http://127.0.0.1:${Number(process.env.TEST_API_PORT)}/auth/login`;

async function runTests() {
  console.log(`1. Testing /auth/login rate limit (10 per minute)`);
  
  let throttled = false;
  
  // We'll make 15 requests to /auth/login. It should throttle after 10.
  // We don't care if it's a 401 Unauthorized, we care if it hits 429 Too Many Requests.
  for (let i = 1; i <= 15; i++) {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: 'test', password: 'test' })
      });
      
      if (res.status === 429) {
        console.log(` - Hit 429 Too Many Requests on request ${i}`);
        assert.ok(i > 10, 'Throttled too early');
        assert.ok(i <= 12, 'Throttled too late');
        throttled = true;
        break;
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.error(`Warning: API server at ${API_URL} is not running. Start it to run this test.`);
        process.exit(1);
      }
      console.error('Fetch failed:', error);
      process.exit(1);
    }
  }

  assert.ok(throttled, 'Rate limit was not enforced for /auth/login');
  
  console.log('--- Phase 4 Rate Limits Test Complete ---');
}

runTests();
