#!/bin/bash
set -e

# ─── Configuración ────────────────────────────────────────────────
SSH_HOST="66.97.40.135"
SSH_USER="root"
SSH_PASS="2i_c3JyyyxQV/n"
REMOTE_BACKEND="/var/www/solrabozzi.com/backend"
REMOTE_FRONTEND="/var/www/solrabozzi.com/frontend"
PM2_APP="solrabozzi.com-backend"

LOCAL_BACKEND="$(cd "$(dirname "$0")/backEnd" && pwd)"
LOCAL_FRONTEND="$(cd "$(dirname "$0")/frontEnd" && pwd)"

SSH="sshpass -p '$SSH_PASS' ssh -o StrictHostKeyChecking=no $SSH_USER@$SSH_HOST"
RSYNC="sshpass -p '$SSH_PASS' rsync -az --delete --progress"

# ─── Colores ──────────────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
ok()   { echo -e "${GREEN}✔ $1${NC}"; }
info() { echo -e "${YELLOW}→ $1${NC}"; }
err()  { echo -e "${RED}✘ $1${NC}"; exit 1; }

echo ""
echo "╔═════════════════════════════════════════════════╗"
echo "║     TECNE - solrabozzi.com  │  DEPLOY SCRIPT    ║"
echo "╚═════════════════════════════════════════════════╝"
echo ""

# ─── 1. Verificar conexión SSH ────────────────────────────────────
info "Verificando conexión SSH a $SSH_HOST..."
eval "$SSH 'echo OK'" > /dev/null 2>&1 || err "No se pudo conectar al servidor"
ok "Conexión SSH exitosa"

# ─── 2. Deploy BACKEND ───────────────────────────────────────────
info "Copiando backend → $SSH_HOST:$REMOTE_BACKEND"
eval "$RSYNC \
  --exclude='node_modules' \
  --exclude='.env' \
  --exclude='logs' \
  --exclude='*.log' \
  --exclude='*.txt' \
  --exclude='debug_*.js' \
  --exclude='dump.json' \
  '$LOCAL_BACKEND/' '$SSH_USER@$SSH_HOST:$REMOTE_BACKEND/'"
ok "Backend copiado"

info "Instalando dependencias del backend en el servidor..."
eval "$SSH 'cd $REMOTE_BACKEND && npm install --omit=dev --silent'"
ok "npm install backend completo"

# ─── 3. Deploy FRONTEND ──────────────────────────────────────────
info "Copiando frontend → $SSH_HOST:$REMOTE_FRONTEND"
eval "$RSYNC \
  --exclude='node_modules' \
  --exclude='dist' \
  '$LOCAL_FRONTEND/' '$SSH_USER@$SSH_HOST:$REMOTE_FRONTEND/'"
ok "Frontend copiado"

info "Instalando dependencias y compilando frontend en el servidor..."
eval "$SSH 'cd $REMOTE_FRONTEND && npm install --silent && npm run build'"
ok "Frontend compilado"

# ─── 4. Reiniciar backend con PM2 ────────────────────────────────
info "Reiniciando backend ($PM2_APP) con PM2..."
eval "$SSH 'pm2 restart $PM2_APP'"
ok "Backend reiniciado"

# ─── 5. Estado final ─────────────────────────────────────────────
echo ""
echo "─────────────────────────────────────────────"
eval "$SSH 'pm2 show $PM2_APP 2>/dev/null | grep -E \"status|restart|uptime|memory\"'"
echo "─────────────────────────────────────────────"
echo ""
ok "Deploy completado exitosamente"
echo ""
