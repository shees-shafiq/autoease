#!/bin/bash
set -euo pipefail

if [ -z "${APP_URL:-}" ]; then
  echo "ERROR: APP_URL environment variable is required."
  echo "Usage: APP_URL=http://<IP>:3000 ./run-tests.sh"
  exit 1
fi

IMAGE_TAG="autoease-tests:latest"

echo "==> Building test image"
docker build -f Dockerfile.tests -t "$IMAGE_TAG" .

echo "==> Running Selenium tests against $APP_URL"
docker run --rm \
  --network host \
  -e APP_URL="$APP_URL" \
  -v "$(pwd)/test-results:/app/target/surefire-reports" \
  "$IMAGE_TAG" \
  mvn test -Dapp.url="$APP_URL"

echo "==> Selenium tests finished"
