# Home Server Deployment Plan

Date: 2026-06-29

This plan describes a local-first path for running Prij Clinic on a current PC or old home PC using fake/demo data only. It is not approval for real patient data, PHI uploads, real AI providers, real payment gateways, or production clinical use.

## Deployment Options

| Option | Cost | Reliability | Security | Setup Difficulty | Remote Access | Backup Difficulty | Best Use Case |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Local laptop | Lowest | Depends on user laptop and power | Best when LAN/private only | Low | Poor unless VPN/tunnel is added | Easy for local backups, weaker if laptop moves | Solo local demo, development, training with fake data |
| Old home PC server | Low if hardware exists | Better if always on with UPS | Moderate; depends on firewall, OS updates, router exposure, and physical security | Medium | LAN is easy; internet access needs DNS/TLS/firewall planning | Medium; needs scheduled local and off-host backups | Local clinic-style demo server, internal LAN trial, family/home lab staging |
| Rented VPS | Monthly cost | Better uptime than home hardware | Moderate to strong if hardened correctly | Medium | Good with domain and TLS | Medium; needs encrypted off-host backup | Serious online staging with fake/demo data |
| Professional cloud deployment | Highest | Highest when designed correctly | Strongest after security/legal gates | High | Strong with managed networking | Strong if managed backup/restore is configured | Future production candidate after legal, privacy, security, and clinical governance approval |

## Acceptable Hardware

Minimum old PC target for fake-data staging:

- 4 CPU cores preferred; 2 cores acceptable for light demos.
- 8 GB RAM minimum; 16 GB recommended.
- SSD strongly recommended.
- 100 GB free disk minimum for Docker images, database, logs, and backups.
- Wired Ethernet preferred over Wi-Fi for a fixed local server.
- Reliable power; a small UPS is recommended.

Avoid using a failing disk, unsupported operating system, or shared family PC for anything beyond a short demo.

## Recommended OS

Recommended:

- Ubuntu Server LTS or Debian stable for an always-on home server.
- Windows 11 with Docker Desktop only for local/private demos where the operator can maintain it.

The home server must receive OS and Docker security updates. Do not expose an unpatched home server to the internet.

## Docker Requirement

Use Docker and Docker Compose for repeatable local staging:

- Postgres stays in the compose network.
- API and web containers are built from the repository.
- Migrations use `npm run prisma:migrate:deploy`.
- Demo seed is explicit and fake-data only.

Do not run database reset/drop commands on a server that has data you care about.

## LAN-Only Deployment Path

LAN-only is the safest home-server path for now:

1. Install Git and Docker.
2. Clone the repository.
3. Create `.env.staging` manually from `.env.staging.example`.
4. Use staging-only secrets and fake/demo passwords.
5. Start `docker-compose.staging.yml`.
6. Run migrations and explicit demo seed.
7. Access the web app from another device using the server LAN IP.
8. Keep the router closed to inbound internet traffic.

LAN-only staging is still not for real patient data until production gates pass.

## Internet-Exposed Path

Internet exposure is higher risk and should wait until a dedicated hardening sprint:

- Use a domain or subdomain.
- Configure HTTPS before any real-world review.
- Use a reverse proxy.
- Expose only HTTP/HTTPS; never expose Postgres.
- Configure firewall rules.
- Use strong staging-only secrets.
- Disable local demo credentials outside local/private demo.
- Monitor logs without PHI.
- Run backups and restore drills.

## Router And ISP Warnings

- Port forwarding can expose the home server to the internet. Misconfiguration can expose admin tools or services.
- Many home ISPs use CGNAT, which prevents direct inbound hosting without a tunnel or VPS relay.
- Dynamic DNS can help with changing IP addresses, but it does not provide security by itself.
- A static IP is convenient but still requires HTTPS, firewall rules, patching, backups, and monitoring.

## Backup Plan

For a home server, use at least:

- Local backup folder under ignored `backups/`.
- External USB drive or NAS copy.
- Off-host encrypted backup for serious staging.
- Restore drill on a disposable database before trusting backups.

Do not commit backup files. Do not restore destructively on a live database without an explicit approved plan.

## Firewall Requirements

LAN-only:

- Allow LAN access to web/API ports only if needed.
- Keep Postgres private to Docker.

Internet-exposed:

- Allow SSH only from trusted IPs if possible.
- Allow HTTPS.
- Keep database and Docker internals private.
- Review reverse proxy configuration before opening ports.

## HTTPS Requirement

No real patient data may be entered over HTTP. HTTPS is required before any real clinic pilot, and production remains blocked until the release gates are complete.

## Recommendation

- Current active path: local staging and home-server readiness using fake/demo data.
- Next practical option: home server dry run if an old PC is available.
- Best serious online staging option: rented VPS with TLS and fake/demo data.
- Real production path: professional hardened hosting after legal, privacy, security, backup, monitoring, and clinical governance gates pass.
