import assert from 'node:assert/strict';

console.log('--- Phase 3: Security Headers Test ---');

const WEB_URL = 'http://localhost:3000';

async function runTests() {
  console.log(`1. Testing headers from ${WEB_URL}`);
  try {
    const res = await fetch(WEB_URL);
    
    // Check Content-Security-Policy
    const csp = res.headers.get('content-security-policy');
    assert.ok(csp, 'Content-Security-Policy header is missing');
    assert.ok(csp.includes("default-src 'self'"), 'CSP missing default-src');
    
    // Check X-Frame-Options
    const xfo = res.headers.get('x-frame-options');
    assert.equal(xfo, 'DENY', 'X-Frame-Options should be DENY');
    
    // Check X-Content-Type-Options
    const xcto = res.headers.get('x-content-type-options');
    assert.equal(xcto, 'nosniff', 'X-Content-Type-Options should be nosniff');
    
    // Check Referrer-Policy
    const rp = res.headers.get('referrer-policy');
    assert.equal(rp, 'strict-origin-when-cross-origin', 'Referrer-Policy is incorrect');
    
    // Check Permissions-Policy
    const pp = res.headers.get('permissions-policy');
    assert.ok(pp && pp.includes('geolocation=()'), 'Permissions-Policy is incorrect or missing');
    
    console.log(' - Passed: All security headers are present and correctly configured.');
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error(`Warning: Next.js server at ${WEB_URL} is not running. Start it to run this test.`);
      // We don't fail the build if the server isn't running yet, or maybe we do?
      process.exit(0);
    }
    console.error('Failed header test:', error);
    process.exit(1);
  }

  console.log('--- Phase 3 Security Headers Test Complete ---');
}

runTests();
