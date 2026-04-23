#!/usr/bin/env bash
set -e

# Force GitHub + Vercel redeploy
# Usage: ./d

echo "🔍 Checking repository..."

git status --short

# Add all tracked/untracked project changes, while .gitignore protects .env, node_modules, bin, etc.
git add -A

if git diff --cached --quiet; then
  echo "📦 No file changes detected. Creating empty redeploy commit..."
  git commit --allow-empty -m "force redeploy" --no-verify
else
  echo "📦 File changes detected. Creating update commit..."
  git commit -m "update project" --no-verify
fi

echo "🚀 Pushing to GitHub main..."
git push origin main

echo "✅ Push done. Vercel should redeploy automatically."
echo "➡️  Check Vercel Deployments and wait for Ready."
