#!/bin/bash
# SaaS Starter launcher for NVIDIA Sync custom app.
# Idempotent: exits 0 if the dev server is already answering, otherwise starts it.
set -u

APP_DIR="$HOME/Projects/sass-starter"
PORT=3001
HOST="0.0.0.0"
URL="http://127.0.0.1:${PORT}"
LOG_DIR="$APP_DIR/.next"
LOG_FILE="$LOG_DIR/sass-starter-dev.log"
PID_FILE="$LOG_DIR/sass-starter-dev.pid"

export PATH="$HOME/.local/share/pnpm/bin:$HOME/.local/share/pnpm:$HOME/.nvm/versions/node/default/bin:$PATH"

mkdir -p "$LOG_DIR"

NEXT_BIN="$APP_DIR/node_modules/.bin/next"

if [ ! -x "$NEXT_BIN" ]; then
  echo "ERROR: Next.js executable was not found at $NEXT_BIN."
  echo "Run pnpm install in $APP_DIR first."
  exit 1
fi

stop_port_listener() {
  PIDS=""

  if command -v lsof >/dev/null 2>&1; then
    PIDS="$(lsof -tiTCP:"$PORT" -sTCP:LISTEN 2>/dev/null | sort -u)"
  fi

  if [ -z "$PIDS" ] && command -v ss >/dev/null 2>&1; then
    PIDS="$(ss -ltnp "sport = :$PORT" 2>/dev/null | sed -n 's/.*pid=\([0-9]\+\).*/\1/p' | sort -u)"
  fi

  NEXT_PIDS="$(pgrep -f "next dev .* -p $PORT" 2>/dev/null || true)"
  if [ -n "$NEXT_PIDS" ]; then
    PIDS="$(printf '%s\n%s\n' "$PIDS" "$NEXT_PIDS" | sed '/^$/d' | sort -u)"
  fi

  if [ -z "$PIDS" ]; then
    return
  fi

  echo "Stopping process(es) listening on port $PORT: $PIDS"
  kill $PIDS >/dev/null 2>&1 || true
  sleep 1

  REMAINING_PIDS=""
  if command -v lsof >/dev/null 2>&1; then
    REMAINING_PIDS="$(lsof -tiTCP:"$PORT" -sTCP:LISTEN 2>/dev/null | sort -u)"
  fi
  if [ -z "$REMAINING_PIDS" ] && command -v ss >/dev/null 2>&1; then
    REMAINING_PIDS="$(ss -ltnp "sport = :$PORT" 2>/dev/null | sed -n 's/.*pid=\([0-9]\+\).*/\1/p' | sort -u)"
  fi

  if [ -n "$REMAINING_PIDS" ]; then
    echo "Port $PORT is still busy; forcing process(es): $REMAINING_PIDS"
    kill -9 $REMAINING_PIDS >/dev/null 2>&1 || true
    sleep 1
  fi
}

# 1. If our recorded process is already up and answering, nothing to do.
if [ -f "$PID_FILE" ]; then
  PID="$(cat "$PID_FILE")"
  if kill -0 "$PID" >/dev/null 2>&1; then
    if curl -sf -o /dev/null "$URL/"; then
      echo "SaaS Starter already running at $URL"
      exit 0
    fi
    echo "Recorded dev server process exists but is not responding; stopping it..."
    kill "$PID" >/dev/null 2>&1 || true
    sleep 1
  fi
  rm -f "$PID_FILE"
fi

# 2. Clear stale servers on the fixed NVIDIA Sync port before starting.
stop_port_listener

if command -v ss >/dev/null 2>&1 && ss -ltn "sport = :$PORT" | grep -q ":$PORT"; then
  echo "ERROR: port $PORT is still busy after cleanup."
  ss -ltnp "sport = :$PORT" || true
  exit 1
fi

if command -v lsof >/dev/null 2>&1 && lsof -tiTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "ERROR: port $PORT is still busy after cleanup."
  lsof -nP -iTCP:"$PORT" -sTCP:LISTEN || true
  exit 1
fi

# 3. Start the Next.js dev server in the background.
cd "$APP_DIR"
setsid "$NEXT_BIN" dev --turbopack -p "$PORT" -H "$HOST" >"$LOG_FILE" 2>&1 </dev/null &
PID="$!"
echo "$PID" > "$PID_FILE"
echo "Waiting for SaaS Starter at $URL (up to 40s)..."

# 4. Wait for the web UI to answer.
for i in $(seq 1 40); do
  if curl -sf -o /dev/null "$URL/"; then
    sleep 1
    if ! kill -0 "$PID" >/dev/null 2>&1; then
      echo "ERROR: dev server answered once, then exited. Last logs:"
      tail -30 "$LOG_FILE"
      rm -f "$PID_FILE"
      exit 1
    fi
    echo "SaaS Starter is up at $URL"
    exit 0
  fi
  if ! kill -0 "$PID" >/dev/null 2>&1; then
    echo "ERROR: dev server exited during startup. Last logs:"
    tail -30 "$LOG_FILE"
    rm -f "$PID_FILE"
    exit 1
  fi
  sleep 1
done

echo "ERROR: SaaS Starter did not respond within 40s. Last logs:"
tail -30 "$LOG_FILE"
exit 1
