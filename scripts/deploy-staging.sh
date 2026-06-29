#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${STAGING_ENV_FILE:-.env.staging}"
COMPOSE_PROJECT="${COMPOSE_PROJECT:-prij-clinic-staging}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.staging.yml}"
RUN_MIGRATIONS=false
SEED_DEMO=false

for arg in "$@"; do
  case "$arg" in
    --migrate) RUN_MIGRATIONS=true ;;
    --seed-demo) SEED_DEMO=true ;;
    --help|-h)
      echo "Usage: ./scripts/deploy-staging.sh [--migrate] [--seed-demo]"
      exit 0
      ;;
    *)
      echo "Unknown argument: $arg" >&2
      exit 1
      ;;
  esac
done

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing $ENV_FILE. Copy .env.staging.example to $ENV_FILE and edit staging-only values." >&2
  exit 1
fi

if grep -Eq '^APP_ENV=production' "$ENV_FILE"; then
  echo "Refusing to run staging deploy with APP_ENV=production." >&2
  exit 1
fi

if ! grep -Eq '^APP_ENV=staging' "$ENV_FILE"; then
  echo "Refusing to run staging deploy unless APP_ENV=staging is set in $ENV_FILE." >&2
  exit 1
fi

if grep -Eq '=(eyad|LocalDev123!)$' "$ENV_FILE"; then
  echo "Refusing staging deploy with local default demo passwords in $ENV_FILE." >&2
  exit 1
fi

echo "Building and starting staging containers with project $COMPOSE_PROJECT"
docker compose --env-file "$ENV_FILE" -p "$COMPOSE_PROJECT" -f "$COMPOSE_FILE" up -d --build postgres api web

if [ "$RUN_MIGRATIONS" = true ]; then
  echo "Running Prisma migrate deploy inside staging API container"
  docker compose --env-file "$ENV_FILE" -p "$COMPOSE_PROJECT" -f "$COMPOSE_FILE" run --rm api npm run prisma:migrate:deploy
fi

if [ "$SEED_DEMO" = true ]; then
  echo "Running explicit staging demo seed. Use fake/demo data only."
  docker compose --env-file "$ENV_FILE" -p "$COMPOSE_PROJECT" -f "$COMPOSE_FILE" run --rm api npm run prisma:seed
else
  echo "Skipping seed. Re-run with --seed-demo only for fake/demo staging data."
fi

docker compose --env-file "$ENV_FILE" -p "$COMPOSE_PROJECT" -f "$COMPOSE_FILE" ps

echo "Health checks:"
echo "  curl -f \${API_URL:-http://localhost:3001}/health"
echo "  curl -f \${API_URL:-http://localhost:3001}/health/db"
echo "  curl -f \${APP_URL:-http://localhost:3000}/login"
