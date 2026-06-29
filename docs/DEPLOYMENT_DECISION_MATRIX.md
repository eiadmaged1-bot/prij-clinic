# Deployment Decision Matrix

Date: 2026-06-29

This matrix compares deployment choices for the current V0.1 MVP release-candidate foundation. All near-term options are fake/demo data only. Real production remains blocked until legal, privacy, security, backup, monitoring, and clinical governance gates pass.

## Comparison

| Option | When To Use | Pros | Cons | Risks | Cost | Security Level | Required Next Steps |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Keep local laptop only | Development, quick demos, private testing | Lowest cost, simple, no internet exposure by default | Not always on, poor shared access, depends on laptop health | Data loss if not backed up; accidental use of real data; laptop sleep/power issues | Lowest | Good if local/private only | Keep backups, run tests, do not enter real data |
| Old home PC server | Local clinic-style demo, LAN trial, always-on fake-data staging | Low cost if hardware exists, more stable than laptop, accessible on LAN | Requires maintenance, power, updates, backups, and network setup | Router exposure mistakes, CGNAT, weak physical security, power loss | Low to medium | Moderate if LAN-only; higher risk if internet-exposed | Run Home Server Dry Run, configure backups, avoid port forwarding until hardened |
| Rented VPS | Serious online staging with fake/demo data | Stable internet access, easier domain/TLS, better uptime than home PC | Monthly cost, requires server hardening and secrets management | Public attack surface, misconfigured firewall, weak credentials | Medium | Moderate to strong if hardened | Execute Real VPS Trial, configure TLS, staging-only secrets, backups, smoke tests |
| Professional cloud deployment | Future production candidate | Managed services, stronger security controls, monitoring and backups available | Highest complexity and cost | Compliance gaps if rushed; cloud PHI contracts and policies required | Highest | Strongest after formal design | Complete production-readiness gates, legal/privacy review, monitoring, backup/restore proof |

## Recommendation

- Now: keep local staging only and continue using fake/demo data.
- Next practical option: run a Home Server Dry Run if an old PC is available.
- Best serious online staging option: rented VPS with TLS and fake/demo data.
- Real production path: professional hardened hosting only after legal, privacy, security, backup, monitoring, and clinical governance gates are complete.

## Blocked Until Later

- Real patient data.
- PHI file uploads.
- Real AI provider access.
- Real payment gateway.
- Public production launch.

## Decision Notes

Missing VPS access is no longer a blocker for local progress. The project can proceed with local/home-server readiness while keeping VPS deployment as a prepared future option.
