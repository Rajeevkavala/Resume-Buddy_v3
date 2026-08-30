#!/bin/bash
set -e
echo "Running Certbot for api.resume-buddy.tech..."
certbot --nginx -d api.resume-buddy.tech --non-interactive --agree-tos -m resumebuddy0@gmail.com --redirect
systemctl reload nginx
echo "SSL Enabled successfully for api.resume-buddy.tech!"
