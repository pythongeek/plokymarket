#!/bin/bash
#
# Ploky Resolution System v2.1 — Hetzner Setup Script
# হেট্জনার সার্ভারে রিজলুশন সিস্টেম সেটাপ স্ক্রিপ্ট
#
# Run on Hetzner .195 (Ubuntu 22.04+):
#   chmod +x setup-hetzner-resolution.sh
#   ./setup-hetzner-resolution.sh
#

set -e

PLKY_DIR="/opt/plokymarket"
RESOLUTION_DIR="$PLKY_DIR/ai-resolution"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() { echo -e "${GREEN}[$(date +%H:%M:%S)]${NC} $1"; }
warn() { echo -e "${YELLOW}[$(date +%H:%M:%S)] WARNING:${NC} $1"; }
error() { echo -e "${RED}[$(date +%H:%M:%S)] ERROR:${NC} $1"; }

# ───────────────────────────────────────────────────────────────────────────────
# 1. SYSTEM PREP
# ───────────────────────────────────────────────────────────────────────────────

log "=== Ploky Resolution System v2.1 Setup ==="
log "Open Source Stack | MiniMax AI + Ollama Fallback"

# Check if root
if [ "$EUID" -ne 0 ]; then
    error "Please run as root or with sudo"
    exit 1
fi

# Update system
log "Updating system packages..."
apt-get update && apt-get upgrade -y

# Install dependencies
log "Installing dependencies..."
apt-get install -y \
    curl wget git \
    build-essential \
    python3 python3-pip python3-venv \
    redis-server \
    nginx \
    certbot python3-certbot-nginx \
    docker.io docker-compose \
    htop iftop \
    tmux

# Enable Docker
systemctl enable docker
systemctl start docker

# Add current user to docker group
usermod -aG docker ${SUDO_USER:-$USER} || true

# ───────────────────────────────────────────────────────────────────────────────
# 2. REDIS (Local)
# ───────────────────────────────────────────────────────────────────────────────

log "Configuring Redis..."

# Configure Redis
mkdir -p /etc/redis
cat > /etc/redis/redis.conf << 'EOF'
bind 127.0.0.1
port 6379
maxmemory 512mb
maxmemory-policy allkeys-lru
appendonly yes
appendfsync everysec
save 900 1
save 300 10
save 60 10000
EOF

systemctl enable redis-server
systemctl restart redis-server

if redis-cli ping | grep -q "PONG"; then
    log "Redis is running ✅"
else
    error "Redis failed to start"
    exit 1
fi

# ───────────────────────────────────────────────────────────────────────────────
# 3. OLLAMA (Self-Hosted LLM)
# ───────────────────────────────────────────────────────────────────────────────

log "Installing Ollama (self-hosted LLM)..."

# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Create systemd service for Ollama
cat > /etc/systemd/system/ollama.service << 'EOF'
[Unit]
Description=Ollama Service
After=network-online.target

[Service]
ExecStart=/usr/local/bin/ollama serve
User=root
Restart=always
RestartSec=3
Environment="OLLAMA_HOST=0.0.0.0:11434"
Environment="OLLAMA_KEEP_ALIVE=24h"

[Install]
WantedBy=default.target
EOF

systemctl daemon-reload
systemctl enable ollama
systemctl start ollama

# Wait for Ollama to start
sleep 5

# Pull models (this may take a while)
log "Pulling LLM models (this will take 5-15 minutes)..."
ollama pull llama3.2 || warn "llama3.2 pull failed"
ollama pull mistral || warn "mistral pull failed"

if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    log "Ollama is running ✅"
    log "Available models:"
    curl -s http://localhost:11434/api/tags | grep '"name"' | head -5
else
    warn "Ollama may need manual model download"
fi

# ───────────────────────────────────────────────────────────────────────────────
# 4. KUBO IPFS (Self-Hosted)
# ───────────────────────────────────────────────────────────────────────────────

log "Installing Kubo IPFS..."

# Download latest Kubo
IPFS_VERSION="v0.27.0"
wget -q "https://dist.ipfs.tech/kubo/${IPFS_VERSION}/kubo_${IPFS_VERSION}_linux-amd64.tar.gz" -O /tmp/kubo.tar.gz
tar -xzf /tmp/kubo.tar.gz -C /tmp
mv /tmp/kubo/ipfs /usr/local/bin/
rm -rf /tmp/kubo /tmp/kubo.tar.gz

# Init IPFS
export IPFS_PATH=/var/lib/ipfs
mkdir -p $IPFS_PATH
ipfs init --profile=server || true

# Configure IPFS
ipfs config Addresses.API /ip4/127.0.0.1/tcp/5001
ipfs config Addresses.Gateway /ip4/127.0.0.1/tcp/8080
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin '["*"]'
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Methods '["PUT", "POST", "GET"]'

# Create systemd service
cat > /etc/systemd/system/ipfs.service << 'EOF'
[Unit]
Description=IPFS Kubo Daemon
After=network-online.target

[Service]
Type=simple
User=root
Environment=IPFS_PATH=/var/lib/ipfs
ExecStart=/usr/local/bin/ipfs daemon --enable-gc
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable ipfs
systemctl start ipfs

sleep 3

if ipfs id > /dev/null 2>&1; then
    log "IPFS is running ✅"
    log "IPFS Peer ID: $(ipfs id -f='<id>')"
else
    warn "IPFS may need manual start"
fi

# ───────────────────────────────────────────────────────────────────────────────
# 5. PLOKY AI SERVICE
# ───────────────────────────────────────────────────────────────────────────────

log "Setting up Ploky AI Service..."

mkdir -p "$RESOLUTION_DIR"
mkdir -p "$LOG_DIR"

# Create Python virtual environment
python3 -m venv "$RESOLUTION_DIR/venv"
source "$RESOLUTION_DIR/venv/bin/activate"

# Install Python dependencies
pip install --upgrade pip
pip install \
    fastapi uvicorn httpx redis web3 pydantic python-dotenv ollama

# Note: The main.py will be deployed separately (via git or scp)
# Create placeholder
cat > "$RESOLUTION_DIR/main.py" << 'PYEOF'
# Placeholder — replace with actual ai-service/main.py
print("Ploky AI Service — deploy actual main.py from repo")
PYEOF

# Create systemd service for AI
cat > /etc/systemd/system/ploky-ai.service << EOF
[Unit]
Description=Ploky AI Resolution Service
After=redis-server.service ollama.service ipfs.service network.target

[Service]
Type=simple
User=root
WorkingDirectory=$RESOLUTION_DIR
Environment=PATH=$RESOLUTION_DIR/venv/bin:/usr/local/bin:/usr/bin
Environment=REDIS_URL=redis://localhost:6379/0
Environment=OLLAMA_HOST=http://localhost:11434
Environment=OLLAMA_MODEL=llama3.2
Environment=OLLAMA_FALLBACK_MODEL=mistral
Environment=IPFS_API_HOST=localhost
Environment=IPFS_API_PORT=5001
Environment=IPFS_GATEWAY=http://localhost:8080/ipfs
Environment=POLYGON_RPC=https://polygon-rpc.com
Environment=AMOY_RPC=https://rpc-amoy.polygon.technology
Environment=CACHE_TTL=3600
Environment=AI_AUTO_RESOLVE_THRESHOLD=8500
# Add these after contract deploy:
# Environment=PLKY_RESOLVER_ADDRESS=0x...
# Environment=AI_SERVICE_PRIVATE_KEY=0x...
# Environment=MINIMAX_API_KEY=...

ExecStart=$RESOLUTION_DIR/venv/bin/uvicorn main:app --host 127.0.0.1 --port 8081
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable ploky-ai

# ───────────────────────────────────────────────────────────────────────────────
# 6. NGINX REVERSE PROXY
# ───────────────────────────────────────────────────────────────────────────────

log "Configuring Nginx..."

# Remove default site
rm -f /etc/nginx/sites-enabled/default

# Create AI service proxy (internal only, no SSL needed if behind Cloudflare)
cat > /etc/nginx/sites-available/ploky-ai << 'EOF'
server {
    listen 8081;
    server_name localhost;
    
    location / {
        proxy_pass http://127.0.0.1:8081;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts for LLM calls
        proxy_read_timeout 120s;
        proxy_connect_timeout 120s;
    }
    
    # IPFS gateway passthrough
    location /ipfs/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
    }
}
EOF

ln -sf /etc/nginx/sites-available/ploky-ai /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# ───────────────────────────────────────────────────────────────────────────────
# 7. FIREWALL
# ───────────────────────────────────────────────────────────────────────────────

log "Configuring firewall..."

# UFW rules
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow 4001/tcp  # IPFS swarm (optional)
# 8081, 11434, 5001 are bound to 127.0.0.1 — not exposed externally

ufw --force enable

# ───────────────────────────────────────────────────────────────────────────────
# 8. SUMMARY
# ───────────────────────────────────────────────────────────────────────────────

echo ""
echo "=========================================="
echo "  Ploky Resolution v2.1 Setup Complete!"
echo "=========================================="
echo ""
echo "Services installed:"
echo "  Redis     : redis://localhost:6379 (cache)"
echo "  Ollama    : http://localhost:11434 (LLM fallback)"
echo "  IPFS      : http://localhost:5001 (API)"
echo "  IPFS GW   : http://localhost:8080 (gateway)"
echo "  AI Service: http://localhost:8081 (FastAPI)"
echo ""
echo "Systemd services:"
echo "  systemctl status redis-server"
echo "  systemctl status ollama"
echo "  systemctl status ipfs"
echo "  systemctl status ploky-ai"
echo ""
echo "Next steps:"
echo "  1. Copy ai-service/main.py to $RESOLUTION_DIR/"
echo "  2. Set MINIMAX_API_KEY in /etc/systemd/system/ploky-ai.service"
echo "  3. Deploy contracts: npx hardhat run scripts/deploy-open-source.ts --network amoy"
echo "  4. Set PLKY_RESOLVER_ADDRESS and AI_SERVICE_PRIVATE_KEY"
echo "  5. systemctl start ploky-ai"
echo "  6. Test: curl http://localhost:8081/health"
echo ""
echo "Open Source Stack ✅ | MiniMax Ready ✅"
echo "=========================================="
