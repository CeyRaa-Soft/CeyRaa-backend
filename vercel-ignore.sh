#!/bin/bash

echo "Branch: $VERCEL_GIT_COMMIT_REF"

if [ "$VERCEL_GIT_COMMIT_REF" = "main" ] || [ "$VERCEL_GIT_COMMIT_REF" = "test" ]; then
  echo "Deploying"
  exit 1
else
  echo "Skipping deployment"
  exit 0
fi