#!/bin/bash
# Run once on the server to set up the BubbleIndex backend.
# Usage: bash backend/deploy/setup.sh

set -e

REPO_DIR="/home/ubuntu/BubbleIndex"
BACKEND_DIR="$REPO_DIR/backend"
SERVICE_NAME="bubbleindex"

echo "=== BubbleIndex Backend Setup ==="

# 1. Python virtual environment
echo "[1/5] Creating virtual environment..."
cd "$BACKEND_DIR"
python3 -m venv venv
venv/bin/pip install --upgrade pip
venv/bin/pip install -r requirements.txt

# 2. Create data directories
echo "[2/5] Creating data directories..."
mkdir -p data/cache

# 3. Create .env from example if not already present
if [ ! -f ".env" ]; then
    echo "[3/5] Creating .env from example — EDIT THIS FILE before starting the service!"
    cp .env.example .env
else
    echo "[3/5] .env already exists, skipping."
fi

# 4. Install systemd service
echo "[4/5] Installing systemd service..."
sudo cp deploy/bubbleindex.service /etc/systemd/system/${SERVICE_NAME}.service
sudo systemctl daemon-reload
sudo systemctl enable "$SERVICE_NAME"

echo ""
echo "=== Setup complete ==="
echo ""
echo "Next steps:"
echo "  1. Edit $BACKEND_DIR/.env with your real API keys"
echo "  2. sudo systemctl start $SERVICE_NAME"
echo "  3. sudo systemctl status $SERVICE_NAME"
echo "  4. sudo journalctl -u $SERVICE_NAME -f   (to watch logs)"
