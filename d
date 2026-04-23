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

# ─────────────────────────────────────────
# AUTO ANALYSE POST-DEPLOY
# ─────────────────────────────────────────
echo "📊 Running quick deployment analysis..."

# Wait a few seconds for Vercel to start deploy
sleep 5

# Check if site is reachable
URL="https://qyraze.com"
STATUS=$(curl -o /dev/null -s -w "%{http_code}" $URL)

if [ "$STATUS" = "200" ]; then
  echo "✅ Site is LIVE (HTTP 200)"
else
  echo "⚠️ Site not ready yet (HTTP $STATUS)"
fi

# Optional: open site in browser (Mac only)
if [[ "$OSTYPE" == "darwin"* ]]; then
  open "$URL"
fi

echo "📈 Deploy + basic check complete."
