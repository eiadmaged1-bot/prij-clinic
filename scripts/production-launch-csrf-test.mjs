import { execSync } from 'node:child_process';
import assert from 'node:assert/strict';

console.log('--- Phase 2: CSRF Protection Test ---');

const API_URL = 'http://localhost:3001';

async function runTests() {
  console.log('1. Testing missing CSRF token on mutation');
  try {
    const res = await fetch(`${API_URL}/auth/logout`, {
      method: 'POST', // Mutating method, though health/live might only support GET, it still hits global guard
    });
    const body = await res.json();
    assert.equal(res.status, 403);
    assert.equal(body.error?.code || body.code, 'CSRF_VALIDATION_FAILED');
    console.log(' - Passed: Missing CSRF token blocked with 403 CSRF_VALIDATION_FAILED');
  } catch (error) {
    console.error('Failed test 1:', error);
    process.exit(1);
  }

  console.log('2. Testing missing CSRF header but cookie present');
  try {
    const res = await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'cookie': 'csrf-token=test-token-123'
      }
    });
    const body = await res.json();
    assert.equal(res.status, 403);
    assert.equal(body.error?.code || body.code, 'CSRF_VALIDATION_FAILED');
    console.log(' - Passed: Missing CSRF header blocked');
  } catch (error) {
    console.error('Failed test 2:', error);
    process.exit(1);
  }

  console.log('3. Testing mismatching CSRF tokens');
  try {
    const res = await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'cookie': 'csrf-token=test-token-123',
        'x-csrf-token': 'wrong-token-456'
      }
    });
    const body = await res.json();
    assert.equal(res.status, 403);
    assert.equal(body.error?.code || body.code, 'CSRF_VALIDATION_FAILED');
    console.log(' - Passed: Mismatching tokens blocked');
  } catch (error) {
    console.error('Failed test 3:', error);
    process.exit(1);
  }

  console.log('4. Testing matching CSRF tokens');
  try {
    const res = await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'cookie': 'csrf-token=test-token-123',
        'x-csrf-token': 'test-token-123'
      }
    });
    // It might return 404 because /health/live doesn't support POST, but it passed the CSRF guard!
    assert.notEqual(res.status, 403);
    console.log(' - Passed: Matching tokens allowed through guard');
  } catch (error) {
    console.error('Failed test 4:', error);
    process.exit(1);
  }

  console.log('5. Testing GET request bypasses CSRF');
  try {
    const res = await fetch(`${API_URL}/health/live`, {
      method: 'GET'
    });
    // It might return 200 or 404 depending on if the route exists yet, but not 403 CSRF.
    assert.notEqual(res.status, 403);
    console.log(' - Passed: GET request bypasses CSRF guard');
  } catch (error) {
    console.error('Failed test 5:', error);
    process.exit(1);
  }

  console.log('--- Phase 2 CSRF Test Complete ---');
}

runTests();
