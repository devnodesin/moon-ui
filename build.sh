#!/bin/bash

set -e  # Exit on error

# Configuration
BUILD_DIR="dist"
DEPLOY_DIR="/html/moon-ui/"

# Install dependencies
echo "Installing dependencies..."
npm ci || npm install

# Build the project
echo "Building Moon UI..."
npm run build

# Deploy build output
if [ -d "$BUILD_DIR" ]; then
    echo "Deploying build output to $DEPLOY_DIR..."
    mkdir -p "$DEPLOY_DIR"
    # Set owner/group to www-data for web server access (optional)
    echo "Set Owner/Group of $BUILD_DIR: chown -R www-data:www-data $BUILD_DIR"
    chown -R www-data:www-data "$BUILD_DIR" || true
    # Deploy files
    echo "Running: rsync -ahWO --no-compress --delete --stats --no-perms --no-owner --no-group $BUILD_DIR/ $DEPLOY_DIR"
    rsync -ahWO --no-compress --delete --stats --no-perms --no-owner --no-group "$BUILD_DIR/" "$DEPLOY_DIR"
    # Set owner/group once again for safety
    echo "Set Owner/Group of $DEPLOY_DIR: chown -R www-data:www-data $DEPLOY_DIR"
    chown -R www-data:www-data "$DEPLOY_DIR" || true
    echo "Deployment complete."
else
    echo "Build directory $BUILD_DIR does not exist. Build failed or output missing."
    exit 1
fi

echo "build.sh completed."
