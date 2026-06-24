#!/usr/bin/env zsh
set -euo pipefail
cd "$(dirname "$0")/.."
LOG=deploy-pipeline.log
: > "$LOG"

run() {
  echo "=== $1 ===" | tee -a "$LOG"
  shift
  if "$@" >> "$LOG" 2>&1; then
    echo "EXIT:0" | tee -a "$LOG"
  else
    echo "EXIT:$?" | tee -a "$LOG"
    exit 1
  fi
}

run "pnpm install" pnpm install
run "pnpm build" pnpm build
run "pnpm test" pnpm test
run "playwright install chromium" pnpm exec playwright install chromium
run "capture screenshot" node scripts/capture-screenshot.mjs
run "verify screenshot" ls -la public/screenshot.png
run "git add" git add -A
git -c core.editor=true commit -m "feat: redesign UI and add real Playwright screenshot" >> "$LOG" 2>&1 || echo "EXIT:commit skipped" | tee -a "$LOG"
run "git push" git push origin main
run "vercel deploy" pnpm exec vercel deploy --prod -y
echo "DONE" | tee -a "$LOG"
