# Google Form Intake API Contract

Status: implementation complete for review; do not activate a Google Form trigger before clinic approval.

## Paths

- Public webhook: `https://regretful-unwomanly-silliness.ngrok-free.dev/api/backend/external-intake/google-form`
- Local same-origin webhook: `http://localhost:3000/api/backend/external-intake/google-form`
- Method: `POST`

Port 3001 is internal-only. Do not expose API port 3001. All external and browser traffic must use the web proxy path `/api/backend/...`.

## Required headers

```text
Content-Type: application/json
X-Prij-Timestamp: <Unix time in whole seconds>
X-Prij-Signature: sha256=<64 lowercase hexadecimal characters>
```

For a no-write validation request, also send:

```text
X-Prij-Dry-Run: true
```

## HMAC signature

- Algorithm: HMAC-SHA256.
- Secret: the shared secret stored in environment configuration and Apps Script Properties only.
- Canonical string: `X-Prij-Timestamp + "." + exactRawRequestBody`.
- Output encoding: lowercase hexadecimal.
- Header value: `sha256=` followed by the hexadecimal digest.
- The JSON body must be serialized exactly once. Sign the same UTF-8 string that is sent as the request body; whitespace and property-order changes produce a different signature.
- The server compares signatures in constant time.

The request timestamp must be Unix seconds and within ±300 seconds of server time. The `submittedAt` value must be a valid ISO-8601 timestamp and, by default, within ±900 seconds of server time. These windows may be changed by controlled server environment configuration.

Each accepted signature/timestamp pair is single-use. An exact replay receives `403`. A legitimate retry must use a fresh `X-Prij-Timestamp` and freshly calculated signature while retaining the same stable `submissionId` and body content.

## Payload

```json
{
  "submissionId": "string",
  "submittedAt": "ISO-8601 timestamp",
  "fullName": "string",
  "primaryPhone": "string",
  "addressText": "string",
  "spouseName": "string",
  "birthValue": "string",
  "followUpType": "string",
  "secondaryPhone": "string"
}
```

Validation rules:

- `submissionId`: required, stable, 6–200 characters; letters, numbers, `.`, `_`, `:`, and `-` only.
- `submittedAt`: required ISO-8601 timestamp within the configured submission window.
- `fullName`: required, trimmed, at least two characters.
- `primaryPhone`: required; spaces, parentheses, dots, and hyphens are removed; `00` is normalized to `+`; final value must contain 8–15 digits with an optional leading `+`. Email addresses and alphabetic text are rejected.
- `secondaryPhone`: optional; when provided, the same phone rules apply.
- `birthValue`: optional; either a four-digit year from 1900 through the current year or an ISO calendar date in `YYYY-MM-DD` format.
- `followUpType`: required and mapped only from approved values: `pregnancy`, `obstetric`, `antenatal`, `gynecology`, `gynaecology`, `gyn`, `infertility`, `fertility`, `follow_up`, `general`, `women_health`, `متابعة حمل`, `شكوى نساء`, `تأخر حمل`, or `متابعة عامة`.
- `addressText` and `spouseName`: optional strings; they remain pending intake data until reviewed.

The receiver creates a pending Intake Inbox item and records possible matches by normalized phone and name. It never automatically merges or creates a patient. A reviewer must attach it to an existing patient, create a new patient, reject it, or request correction. The original submitted body is preserved with the intake record, and decisions are audited.

## Responses

Created:

```http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "intakeId": "uuid",
  "status": "pending_review",
  "duplicate": false
}
```

Idempotent duplicate with the same `submissionId` and identical body:

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "intakeId": "existing uuid",
  "status": "pending_review",
  "duplicate": true
}
```

Conflicting duplicate with the same `submissionId` but different body:

```http
HTTP/1.1 409 Conflict
Content-Type: application/json

{
  "statusCode": 409,
  "message": "This submission ID was already received with different content."
}
```

Validation failure:

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "statusCode": 400,
  "message": "The intake submission contains invalid fields.",
  "fieldErrors": {
    "primaryPhone": "Enter a valid phone number without email or text."
  }
}
```

Missing/expired authentication returns `401`; invalid signature, replay, or unavailable server secret returns `403`. Responses contain a safe message only and never include the secret, submitted patient payload, source code, or stack trace.

Rate limiting returns `429`. Temporary server failures return a retryable `5xx` response with no sensitive detail. Retry `429` or `5xx` with backoff, the same `submissionId` and exact body, plus a new timestamp and signature. Do not retry `400`, `401`, `403`, or `409` without correcting the cause.

Dry-run success:

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "status": "validated",
  "duplicate": false,
  "dryRun": true
}
```

Dry run validates authentication and payload but creates no patient or intake. Security replay metadata may still be recorded, so a later request needs a new timestamp and signature.

## Synthetic test payload

Use only for an approved dry run:

```json
{
  "submissionId": "SYNTHETIC-DRY-RUN-001",
  "submittedAt": "2026-07-13T18:00:00.000Z",
  "fullName": "Synthetic Intake Test",
  "primaryPhone": "+201000000000",
  "addressText": "Synthetic test only",
  "spouseName": "",
  "birthValue": "1990",
  "followUpType": "gynecology",
  "secondaryPhone": ""
}
```

Replace `submittedAt` with the current time and use `X-Prij-Dry-Run: true`.

## Apps Script setup

Store these values in Apps Script Properties, not in code or spreadsheet cells:

- `PRIJ_INTAKE_WEBHOOK_URL`: approved public `/api/backend/external-intake/google-form` URL.
- `PRIJ_INTAKE_SHARED_SECRET`: clinic-provided shared secret.

The Apps Script must construct the payload, call `JSON.stringify` once, calculate the Unix timestamp, sign `timestamp + "." + body`, and send that exact body. Log only response status, submission ID, and retry state; never log the secret or full submission.

Do not store the secret in sheet cells. Do not expose API port 3001. Do not activate the Google Form trigger before the API contract, field mapping, dry-run result, and clinic approval are complete.
