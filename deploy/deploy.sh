#!/bin/sh
# Rolling deploy of one environment. Usage: sh deploy.sh <image tag>
set -eu
export IMAGE_TAG="$1"

docker compose pull
docker compose run --rm backend-a python manage.py migrate --noinput
docker compose up -d --no-deps --wait --wait-timeout 120 backend-a
docker compose up -d --no-deps --wait --wait-timeout 120 backend-b
docker compose up -d --remove-orphans --wait --wait-timeout 120
