#!/bin/sh
set -e

mkdir -p /app/storage
chown -R nextjs:nodejs /app/storage

su-exec nextjs node /app/scripts/migrate.mjs
exec su-exec nextjs node server.js
