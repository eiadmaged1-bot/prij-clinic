# Role Walkthrough Guide

Status: route-level automation and script-assisted browser-facing walkthroughs implemented. Full Playwright screenshot/click automation remains a follow-up.

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
- `node scripts/pilot-walkthrough-test.mjs demo`

Role-specific walkthrough commands are available through:

```bash
npm run test:pilot:owner
npm run test:pilot:doctor
npm run test:pilot:receptionist
npm run test:pilot:accountant
npm run test:pilot:clinical
npm run test:pilot:finance
npm run test:pilot:ai
npm run test:pilot:guidelines
npm run test:pilot:denials
npm run test:pilot:demo
```
- `node scripts/guidelines-test.mjs`
- `npm run test:ai-management`
