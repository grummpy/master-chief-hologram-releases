#!/bin/zsh
set -eu

APP_DIR="/Users/daddy/Desktop/master-chief-hologram"
DESKTOP_DIR="/Users/daddy/Desktop"
APP_BUNDLE="$DESKTOP_DIR/Master Chief Hologram.app"
BUILD_BUNDLE="$APP_DIR/dist/mac-arm64/Master Chief Hologram.app"
LOG_DIR="/Users/daddy/Library/Logs/MasterChiefHologram"
NPM_BIN="/usr/local/bin/npm"
GIT_BIN="/usr/bin/git"
LOCK_DIR="/tmp/master-chief-hologram-launch.lock"

mkdir -p "$LOG_DIR"
cd "$APP_DIR"

# A double-click can race with an existing launch.  Keep one updater/build
# process and one desktop bundle; a second click simply opens the running app.
if ! mkdir "$LOCK_DIR" 2>/dev/null; then
  open -a "$APP_BUNDLE" >/dev/null 2>&1 || true
  exit 0
fi
trap 'rmdir "$LOCK_DIR" 2>/dev/null || true' EXIT

update_repo() {
  [[ -d .git ]] || return 0
  # Never overwrite local work or move between branches implicitly.
  [[ "$("$GIT_BIN" symbolic-ref --short HEAD 2>/dev/null)" == "main" ]] || return 0
  [[ -z "$("$GIT_BIN" status --porcelain 2>/dev/null)" ]] || return 0
  "$GIT_BIN" fetch --quiet origin main >>"$LOG_DIR/launcher.log" 2>&1 || return 0
  "$GIT_BIN" merge-base --is-ancestor HEAD origin/main || {
    # Local is ahead or history diverged; leave it untouched for review.
    return 0
  }
  if [[ "$("$GIT_BIN" rev-parse HEAD)" != "$("$GIT_BIN" rev-parse origin/main)" ]]; then
    "$GIT_BIN" pull --ff-only --quiet origin main >>"$LOG_DIR/launcher.log" 2>&1 || return 0
    "$NPM_BIN" ci --ignore-scripts >>"$LOG_DIR/launcher.log" 2>&1 || return 0
    return 10
  fi
  return 0
}

UPDATE_RESULT=0
update_repo || UPDATE_RESULT=$?

if [[ ! -x "$APP_DIR/node_modules/.bin/electron" ]]; then
  "$NPM_BIN" ci >>"$LOG_DIR/launcher.log" 2>&1
fi

# Build into dist first, then replace the desktop bundle as one directory
# operation.  Preserve the existing bundle if a build fails.
if [[ "$UPDATE_RESULT" -eq 10 || ! -d "$APP_BUNDLE" ]] && [[ -x "$APP_DIR/node_modules/.bin/electron-builder" ]]; then
  "$NPM_BIN" run dist:mac >>"$LOG_DIR/launcher.log" 2>&1 || true
  if [[ -d "$BUILD_BUNDLE" ]]; then
    STAGE_DIR="$(mktemp -d /tmp/master-chief-hologram-stage.XXXXXX)"
    ditto "$BUILD_BUNDLE" "$STAGE_DIR/Master Chief Hologram.app"
    if [[ -d "$APP_BUNDLE" ]]; then
      mv "$APP_BUNDLE" "$DESKTOP_DIR/.Master Chief Hologram.app.previous" 2>/dev/null || true
    fi
    mv "$STAGE_DIR/Master Chief Hologram.app" "$APP_BUNDLE"
    rm -rf "$STAGE_DIR"
    rm -rf "$DESKTOP_DIR/.Master Chief Hologram.app.previous" 2>/dev/null || true
  fi
fi

if [[ -d "$APP_BUNDLE" ]]; then
  open "$APP_BUNDLE" >>"$LOG_DIR/app.log" 2>&1
else
  nohup "$NPM_BIN" start >>"$LOG_DIR/app.log" 2>&1 </dev/null &
fi
exit 0
