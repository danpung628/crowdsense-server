#!/usr/bin/env bash
set -euo pipefail

# Basic system update
sudo apt update && sudo apt upgrade -y

# Install prerequisites
sudo apt install -y git curl build-essential

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MongoDB (Ubuntu default)
sudo apt install -y mongodb
sudo systemctl enable mongodb
sudo systemctl start mongodb

# Install Redis
sudo apt install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server

# PM2 for process management
sudo npm install -g pm2

echo "== Bootstrap complete =="
echo "Next steps:"
echo "1) Copy server/env.ec2.example to server/.env and edit values"
echo "2) From server/, run: npm install"
echo "3) Start with PM2: pm2 start ecosystem.config.js && pm2 save && pm2 startup"


