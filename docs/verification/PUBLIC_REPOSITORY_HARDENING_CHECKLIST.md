# Public Repository Hardening Checklist

Status: REQUIRED BEFORE PUBLIC DEVELOPMENT CONTINUES

## Repository visibility

- [ ] Repository visibility changed to public by the owner.
- [ ] Public visibility confirmed after the change.
- [ ] Private vulnerability reporting enabled.

## Default branch protection

Protect `security/rbac-scope-enforcement` with a branch ruleset:

- [ ] Require a pull request before merging.
- [ ] Require at least one approval.
- [ ] Require review from Code Owners.
- [ ] Dismiss stale approvals when new commits are pushed.
- [ ] Require conversation resolution before merging.
- [ ] Require all mandatory status checks.
- [ ] Require branches to be up to date before merging.
- [ ] Block force pushes.
- [ ] Block branch deletion.
- [ ] Restrict branch updates to the repository owner.
- [ ] Do not allow bypass except for emergency owner recovery.

## Actions security

- [ ] Use GitHub-hosted runners only for active workflows.
- [ ] Set workflow permissions to read-only by default.
- [ ] Grant `contents: write` only to narrowly scoped publish jobs.
- [ ] Pin third-party Actions to full commit SHAs.
- [ ] Do not run untrusted fork code with repository secrets.
- [ ] Require approval for workflows from first-time contributors.
- [ ] Keep secrets unavailable to pull requests from forks.

## Sensitive-data protection

- [ ] Confirm no `.env` files are tracked.
- [ ] Confirm no database exports or patient data are tracked.
- [ ] Confirm no tokens, private keys, passwords, or signed URLs are tracked.
- [ ] Enable secret scanning and push protection.
- [ ] Rotate any credential ever committed, even if later removed.

## Ownership

- [x] `.github/CODEOWNERS` assigns all paths to `@eiadmaged1-bot`.
- [x] `SECURITY.md` prohibits production data and unsafe database operations.

A public fork cannot alter the canonical application. Only users with write access to the original repository can push changes, and protected branches must require owner-approved pull requests.
