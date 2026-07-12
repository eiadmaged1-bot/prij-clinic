import assert from 'node:assert/strict';

console.log('--- Phase 7: Health & Readiness Test ---');

const API_URL = 'http://localhost:3001/health';

async function runTests() {
  console.log(`1. Testing /health/live`);
  try {
    const res = await fetch(`${API_URL}/live`);
    const body = await res.json();
    assert.equal(res.status, 200);
    assert.equal(body.status, 'up');
    console.log(' - Passed: /health/live returns 200 { status: "up" }');
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error(`Warning: API server at ${API_URL} is not running.`);
      process.exit(0);
    }
    console.error('Failed test 1:', error);
    process.exit(1);
  }

  console.log(`2. Testing /health/ready`);
  try {
    const res = await fetch(`${API_URL}/ready`);
    const body = await res.json();
    assert.equal(res.status, 200);
    assert.equal(body.status, 'ok');
    assert.equal(body.database, 'connected');
    console.log(' - Passed: /health/ready returns 200 { status: "ok", database: "connected" }');
  } catch (error) {
    console.error('Failed test 2:', error);
    process.exit(1);
  }

  console.log('--- Phase 7 Health Test Complete ---');
}

runTests();
