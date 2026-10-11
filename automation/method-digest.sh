#!/usr/bin/env bash
# 方法練習室每日產線：每晚 23:00 由 launchd 觸發，headless claude 跑 automation/prompt.md
set -uo pipefail
export PATH="/opt/homebrew/bin:/Users/naichengchen/.local/bin:/usr/bin:/bin:/usr/sbin"
export USER="${USER:-naichengchen}" LOGNAME="${LOGNAME:-naichengchen}" HOME="${HOME:-/Users/naichengchen}"
REPO="/Users/naichengchen/projects/method-studio"
LOG="$REPO/.digest/run.log"; LOCK="$REPO/.digest/.lock"
mkdir -p "$REPO/.digest"
if [ -e "$LOCK" ] && kill -0 "$(cat "$LOCK")" 2>/dev/null; then echo "$(date '+%F %T') 上一輪仍在跑，跳過" >> "$LOG"; exit 0; fi
echo $$ > "$LOCK"; trap 'rm -f "$LOCK"' EXIT
echo "=== method-digest $(date '+%F %T') ===" >> "$LOG"
cd "$REPO" || exit 1
/Users/naichengchen/.local/bin/claude -p "$(cat "$REPO/automation/prompt.md")" --dangerously-skip-permissions --model sonnet --max-turns 150 --max-budget-usd 15 >> "$LOG" 2>&1
echo "=== done exit=$? $(date '+%F %T') ===" >> "$LOG"
