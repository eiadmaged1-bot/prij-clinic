# Hosted Sprint 1 Offline Sync Health Controller

Target application branch: `work/offline-sync-health-v1`

This controller applies and verifies one large Sprint 1 package:

- local unsigned-visit autosave;
- patient-and-encounter-scoped pending sync queue;
- automatic retry after connectivity returns;
- optimistic-concurrency conflict preservation;
- explicit conflict recovery without automatic overwrite;
- global sync-health counts in receptionist and clinical shells;
- signing and printing blocked until synchronization completes.

The controller runs on GitHub-hosted `ubuntu-latest` and verifies Patient Safety Core, Reception and Queue Core, Features 46–49, medication regressions, typecheck, production build, exact file scope, evidence generation, and commit/push.

Safety boundaries:

- no migration;
- no seed;
- no reset, deletion, or truncation;
- no production-data mutation;
- no secret change;
- no authentication material persisted in the offline queue.
