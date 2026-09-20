#!/bin/bash

echo "Branch: $VERCEL_GIT_COMMIT_REF"
echo "Target DEPLOY_BRANCH: $DEPLOY_BRANCH"
echo "Vercel Environment: $VERCEL_ENV"

# 1. If DEPLOY_BRANCH is set in Vercel project environment variables, strictly enforce it:
if [ -n "$DEPLOY_BRANCH" ]; then
  if [ "$VERCEL_GIT_COMMIT_REF" = "$DEPLOY_BRANCH" ]; then
    echo "✅ Branch matches DEPLOY_BRANCH ($DEPLOY_BRANCH). Deploying."
    exit 1
  else
    echo "🛑 Branch ($VERCEL_GIT_COMMIT_REF) does not match DEPLOY_BRANCH ($DEPLOY_BRANCH). Skipping deployment."
    exit 0
  fi
fi

# 2. Fallback: Only deploy if this commit is the designated production branch for this project
if [ "$VERCEL_ENV" = "production" ]; then
  echo "✅ Production branch for this project detected ($VERCEL_GIT_COMMIT_REF). Deploying."
  exit 1
else
  echo "🛑 Preview or non-target branch ($VERCEL_GIT_COMMIT_REF). Skipping deployment."
  exit 0
fi