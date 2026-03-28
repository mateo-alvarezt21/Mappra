#!/bin/sh
# Replace __API_URL__ placeholder in nginx config with the real API internal URL.
# Default: http://api:3001  (assumes EasyPanel service named "api")
API_URL="${API_INTERNAL_URL:-http://api:3001}"
sed -i "s|__API_URL__|${API_URL}|g" /etc/nginx/conf.d/default.conf
echo "nginx: proxying /api/ → ${API_URL}"
