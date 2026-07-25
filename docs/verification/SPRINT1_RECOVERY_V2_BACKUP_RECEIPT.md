# Sprint 1 Recovery V2 Backup Receipt

- Recovery run: `30169958597`
- Runner: `SECTRA`
- Backup step result: **PASS**
- Method: local Docker PostgreSQL `pg_dump`
- Local backup location: stored under `C:\Newfolder\prij-clinic\backups\` on SECTRA
- Local manifest: `BACKUP-MANIFEST.txt` beside the dump contains the exact directory, byte size, and SHA-256
- Database dump uploaded to GitHub: **NO**
- Database mutation performed: **NO**
- Clinical integration executed in this run: **NO** — the later GitHub receipt step failed before integration began

This receipt records the successful local-only database backup confirmed by GitHub Actions run `30169958597`. The dump itself and its detailed manifest remain local on SECTRA.