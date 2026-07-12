# Manual QA Wave 1

This document outlines the manual testing procedures required before production launch.

## 1. Login and CSRF Verification
1. Open an incognito browser window.
2. Navigate to `http://localhost:3000/login`.
3. Open Developer Tools -> Network tab.
4. Attempt to log in with invalid credentials.
5. Verify that a `POST` request is sent to `/api/backend/auth/login`.
6. Verify that the request contains the `x-csrf-token` header.
7. Verify that the server returns a `401 Unauthorized`.
8. Log in with valid credentials.
9. Verify that a session cookie (`prij_clinic_session`) is set.
10. Verify that a `csrf-token` cookie is set.

## 2. API Rate Limiting Verification
1. Write a script or use a tool (e.g. `curl` or Postman) to rapidly send login requests to `/api/backend/auth/login`.
2. After 10 requests within a minute, verify that the server returns `429 Too Many Requests`.

## 3. Owner Diagnostics Page
1. Log in as an OWNER.
2. Navigate to `/owner/diagnostics`.
3. Verify that the "API Status" shows as "up" (green indicator).
4. Verify that the "Recent Audit Logs" table populates with recent system activity.

## 4. General Smoke Testing
1. Navigate through the primary patient management workflows.
2. Verify that pages load without critical errors.
3. Attempt to create a new patient and verify success.
4. Check the application logs to ensure that the patient creation was logged securely without exposing PHI.
