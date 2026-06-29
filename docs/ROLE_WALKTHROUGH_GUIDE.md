# Role Walkthrough Guide

Status: route-level automation implemented; full browser scripts remain a follow-up.

Owner:
- Can manage accounts, settings, protocol editor, source registry, finance reports, and guideline center.

Doctor:
- Can access patient clinical views, protocol atlas read routes, AI Management Snapshot, and guideline search/ask.
- Cannot access owner-only account administration or protocol editor.

Receptionist:
- Can use operational routes allowed by RBAC.
- Denied clinical AI tools, protocol editor, and guideline content.

Accountant:
- Can use finance routes allowed by RBAC.
- Denied clinical AI tools, protocol editor, and guideline content.

Automated role-denial coverage:
- `node scripts/route-authorization-test.mjs`
- `node scripts/guidelines-test.mjs`
- `npm run test:ai-management`
