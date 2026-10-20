#!/bin/sh
# Only SSH, HTTP and HTTPS may reach the server.
# Ports published by Docker bypass ufw, so the stacks bind to 127.0.0.1.
set -e
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 443/udp
ufw --force enable
