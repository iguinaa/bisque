#!/bin/bash
set -e  # Exit on any error

echo "Building Discord bot image..."
docker build -t bisque-bot:latest .

echo "Starting Discord bot with Docker Compose..."
docker compose up --force-recreate