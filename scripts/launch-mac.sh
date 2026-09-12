#!/bin/zsh
set -eu

APP_DIR="/Users/daddy/Desktop/master-chief-hologram"
LOG_DIR="/Users/daddy/Library/Logs/MasterChiefHologram"
NPM_BIN="/usr/local/bin/npm"

mkdir -p "$LOG_DIR"
cd "$APP_DIR"

if [[ ! -x "$APP_DIR/node_modules/.bin/electron" ]]; then
  "$NPM_BIN" install >>"$LOG_DIR/launcher.log" 2>&1
fi

nohup "$NPM_BIN" start >>"$LOG_DIR/app.log" 2>&1 </dev/null &
exit 0
