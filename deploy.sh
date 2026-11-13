#!/usr/bin/env bash
# AllLogic Online — Build, backup, deploy e rollback do Agillex Hub

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

SSH_KEY="$HOME/.ssh/ssh-key-2026-07-03.key"
VPS_HOST="dresler@136.248.113.145"
REMOTE_DIR="/home/dresler/matriz-saas"
BACKUP_ROOT="/home/dresler/private-backups/agillex-hub"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
BACKUP_DIR="$BACKUP_ROOT/pre-deploy-$STAMP"

echo "===== BUILD LOCAL ====="
npm run build

if [ ! -f "$SSH_KEY" ]; then
  echo "ERRO: chave SSH não encontrada."
  exit 1
fi

echo "===== BACKUP REMOTO PRÉ-PUBLICAÇÃO ====="

ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$VPS_HOST" \
  "bash -s -- '$REMOTE_DIR' '$STAMP'" <<'BACKUP'

set -Eeuo pipefail

REMOTE_DIR="$1"
STAMP="$2"
BACKUP_ROOT="/home/dresler/private-backups/agillex-hub"
TMP_DIR="$BACKUP_ROOT/.incomplete-$STAMP"
BACKUP_DIR="$BACKUP_ROOT/pre-deploy-$STAMP"

cd "$REMOTE_DIR"

if [ -n "$(git status --porcelain)" ]; then
  echo "ERRO: VPS possui alterações locais. Backup/deploy interrompido."
  exit 1
fi

docker inspect matriz-postgres >/dev/null
docker inspect matriz-redis >/dev/null
docker inspect matriz-saas >/dev/null

PREVIOUS_COMMIT="$(git rev-parse HEAD)"
IMAGE_ID="$(docker inspect --format '{{.Image}}' matriz-saas)"
IMAGE_REF="$(docker inspect --format '{{.Config.Image}}' matriz-saas)"

docker image inspect "$IMAGE_ID" >/dev/null

umask 077
mkdir -p "$BACKUP_ROOT"
chmod 700 "$BACKUP_ROOT"
mkdir "$TMP_DIR"

trap 'rm -rf "$TMP_DIR"' EXIT

echo "===== BACKUP POSTGRESQL ====="

docker exec matriz-postgres sh -c \
  'pg_dumpall -U "$POSTGRES_USER"' |
  gzip -1 > "$TMP_DIR/postgresql-all.sql.gz"

gzip -t "$TMP_DIR/postgresql-all.sql.gz"
test -s "$TMP_DIR/postgresql-all.sql.gz"

echo "===== BACKUP REDIS ====="

BGSAVE_OUTPUT="$(
  docker exec matriz-redis redis-cli BGSAVE 2>&1
)" || {
  case "$BGSAVE_OUTPUT" in
    *"already in progress"*) ;;
    *)
      echo "ERRO no BGSAVE: $BGSAVE_OUTPUT"
      exit 1
      ;;
  esac
}

REDIS_READY=0

for attempt in $(seq 1 30); do
  REDIS_INFO="$(
    docker exec matriz-redis redis-cli INFO persistence |
    tr -d '\r'
  )"

  if printf '%s\n' "$REDIS_INFO" |
      grep -q '^rdb_bgsave_in_progress:0$' &&
     printf '%s\n' "$REDIS_INFO" |
      grep -q '^rdb_last_bgsave_status:ok$'; then
    REDIS_READY=1
    break
  fi

  sleep 2
done

if [ "$REDIS_READY" -ne 1 ]; then
  echo "ERRO: snapshot Redis não foi concluído."
  exit 1
fi

docker exec matriz-redis sh -c 'tar -C /data -cf - .' |
  gzip -1 > "$TMP_DIR/redis-data.tar.gz"

gzip -t "$TMP_DIR/redis-data.tar.gz"
test -s "$TMP_DIR/redis-data.tar.gz"

echo "===== BACKUP DA APLICAÇÃO ====="

git archive --format=tar HEAD |
  gzip -1 > "$TMP_DIR/source.tar.gz"

gzip -t "$TMP_DIR/source.tar.gz"

docker image save "$IMAGE_REF" |
  gzip -1 > "$TMP_DIR/matriz-saas-image.tar.gz"

gzip -t "$TMP_DIR/matriz-saas-image.tar.gz"

cp -p .env.production "$TMP_DIR/.env.production"
cp -p docker-compose.yml "$TMP_DIR/docker-compose.yml"
cp -p supabase/schema.sql "$TMP_DIR/schema.sql"

cat > "$TMP_DIR/manifest.txt" <<EOF
Backup: $STAMP
Commit anterior: $PREVIOUS_COMMIT
Imagem anterior: $IMAGE_REF
ID da imagem: $IMAGE_ID
Servidor: $(hostname)
EOF

chmod 600 "$TMP_DIR"/*

(
  cd "$TMP_DIR"
  sha256sum \
    postgresql-all.sql.gz \
    redis-data.tar.gz \
    source.tar.gz \
    matriz-saas-image.tar.gz \
    .env.production \
    docker-compose.yml \
    schema.sql > SHA256SUMS
)

( cd "$TMP_DIR" && sha256sum -c SHA256SUMS )

mv "$TMP_DIR" "$BACKUP_DIR"
trap - EXIT

echo "BACKUP VALIDADO: $BACKUP_DIR"

BACKUP
echo "===== BACKUP CONFIRMADO ====="

echo "===== COMMIT E PUSH ====="

COMMIT_MSG="${1:-fix(hub): separar ambientes e automatizar backup pre-deploy}"

if [ -n "$(git status --porcelain)" ]; then
  git add -A
  git commit -m "$COMMIT_MSG"
fi

git push origin main

echo "===== DEPLOY NA VPS ====="

ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$VPS_HOST" \
  "bash -s -- '$REMOTE_DIR' '$BACKUP_DIR'" <<'DEPLOY'

set -Eeuo pipefail

REMOTE_DIR="$1"
BACKUP_DIR="$2"

cd "$REMOTE_DIR"

echo "===== VALIDAR BACKUP ====="

test -f "$BACKUP_DIR/manifest.txt"
test -f "$BACKUP_DIR/SHA256SUMS"

(
  cd "$BACKUP_DIR"
  sha256sum -c SHA256SUMS
)

PREVIOUS_COMMIT="$(
  sed -n 's/^Commit anterior: //p' "$BACKUP_DIR/manifest.txt"
)"

IMAGE_REF="$(
  sed -n 's/^Imagem anterior: //p' "$BACKUP_DIR/manifest.txt"
)"

if [ -z "$PREVIOUS_COMMIT" ] || [ -z "$IMAGE_REF" ]; then
  echo "ERRO: manifesto do backup inválido."
  exit 1
fi

if [ -n "$(git status --porcelain)" ]; then
  echo "ERRO: VPS possui alterações locais."
  exit 1
fi

rollback() {
  echo "===== ROLLBACK DA APLICAÇÃO ====="

  git reset --hard "$PREVIOUS_COMMIT"

  gzip -dc "$BACKUP_DIR/matriz-saas-image.tar.gz" |
    docker load

  docker compose up -d --no-build matriz-saas

  echo "Rollback da aplicação executado."
}

echo "===== ATUALIZAÇÃO DO CÓDIGO ====="

if ! git pull --ff-only origin main; then
  echo "ERRO: atualização do código falhou."
  exit 1
fi

echo "===== REBUILD ====="

if ! docker compose up -d --build matriz-saas; then
  echo "ERRO no rebuild."
  rollback
  exit 1
fi

echo "===== TESTES HTTP ====="

HEALTHY=0

for attempt in $(seq 1 30); do
  if curl -fsS --max-time 5 \
      https://hub.agillex.com.br/login >/dev/null &&
     curl -fsS --max-time 5 \
      https://hub.alllogiconline.com.br/login >/dev/null; then
    HEALTHY=1
    break
  fi

  sleep 2
done

if [ "$HEALTHY" -ne 1 ]; then
  echo "ERRO: validação HTTP falhou."
  rollback
  exit 1
fi

echo "===== RESULTADO ====="
docker compose ps matriz-saas

echo "DEPLOY VALIDADO."
echo "BACKUP: $BACKUP_DIR"
echo "COMMIT: $(git rev-parse --short HEAD)"

DEPLOY

echo ""
echo "===== PUBLICAÇÃO CONCLUÍDA ====="
echo "Agillex Hub: https://hub.agillex.com.br"
echo "AllLogic Hub: https://hub.alllogiconline.com.br"
