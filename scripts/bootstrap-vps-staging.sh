#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/prij-clinic}"
APP_USER="${APP_USER:-$USER}"

echo "Prij Clinic VPS staging bootstrap"
echo "This script prepares a staging host only. It does not write secrets or deploy production."

if [ "$(id -u)" -ne 0 ]; then
  echo "Run with sudo/root on a fresh Ubuntu/Debian VPS." >&2
  exit 1
fi

if ! command -v apt-get >/dev/null 2>&1; then
  echo "This bootstrap script supports apt-based Ubuntu/Debian hosts only." >&2
  exit 1
fi

apt-get update
apt-get install -y ca-certificates curl git ufw

if ! command -v docker >/dev/null 2>&1; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  . /etc/os-release
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu ${VERSION_CODENAME} stable" > /etc/apt/sources.list.d/docker.list
  apt-get update
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi

systemctl enable --now docker

if id "$APP_USER" >/dev/null 2>&1; then
  usermod -aG docker "$APP_USER"
fi

mkdir -p "$APP_DIR"
chown "$APP_USER":"$APP_USER" "$APP_DIR"

if command -v ufw >/dev/null 2>&1; then
  ufw allow OpenSSH
  ufw allow 80/tcp
  ufw allow 443/tcp
  echo "Firewall rules added for SSH, HTTP, and HTTPS. Enable UFW manually after confirming SSH access:"
  echo "  sudo ufw enable"
fi

echo "Bootstrap complete."
echo "Next steps:"
echo "1. Clone the repository into $APP_DIR as $APP_USER."
echo "2. Copy .env.staging.example to .env.staging and edit staging-only secrets."
echo "3. Run ./scripts/deploy-staging.sh --migrate --seed-demo only for fake/demo staging data."
