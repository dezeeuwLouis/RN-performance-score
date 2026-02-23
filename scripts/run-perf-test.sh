#!/usr/bin/env bash
set -euo pipefail

# ─── Orchestrate a local Maestro perf test on iOS Simulator ───
#
# Prerequisites:
#   - Xcode + iOS Simulator installed
#   - Maestro CLI installed (https://maestro.mobile.dev)
#   - yarn dependencies already installed
#
# Usage:
#   bash scripts/run-perf-test.sh

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

APP_ID="rnperfscore.example"
RESULTS_DIR="./perf-results"
RESULTS_FILE="$RESULTS_DIR/rn-perf-score-results.json"
MIN_SCORE=50
METRO_PORT=8081
METRO_PID=""

cleanup() {
  if [[ -n "$METRO_PID" ]]; then
    echo "→ Stopping Metro (PID $METRO_PID)..."
    kill "$METRO_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

# ── 1. Build CLI ──
echo "→ Building CLI..."
yarn build:cli

# ── 2. Boot iOS Simulator if needed ──
BOOTED=$(xcrun simctl list devices booted -j | node -pe 'JSON.parse(require("fs").readFileSync(0,"utf8")).devices' 2>/dev/null | node -pe '
  const d = JSON.parse(require("fs").readFileSync(0,"utf8"));
  Object.values(d).flat().filter(x => x.state === "Booted").length
' 2>/dev/null || echo 0)

if [[ "$BOOTED" -eq 0 ]]; then
  echo "→ No simulator booted. Booting default device..."
  xcrun simctl boot "iPhone 16 Pro" 2>/dev/null || true
  sleep 5
fi

# ── 3. Build + install example app ──
echo "→ Building iOS example app..."
yarn turbo run build:ios

echo "→ Installing app on simulator..."
APP_PATH=$(find example/ios/build -name "*.app" -type d 2>/dev/null | head -1)
if [[ -z "$APP_PATH" ]]; then
  echo "Error: Could not find built .app bundle" >&2
  exit 1
fi
xcrun simctl install booted "$APP_PATH"

# ── 4. Start Metro in background ──
echo "→ Starting Metro on port $METRO_PORT..."
yarn --cwd example start --port "$METRO_PORT" &
METRO_PID=$!

# ── 5. Wait for Metro to be ready ──
echo "→ Waiting for Metro..."
for i in $(seq 1 30); do
  if curl -s "http://localhost:$METRO_PORT/status" >/dev/null 2>&1; then
    echo "  Metro ready."
    break
  fi
  if [[ $i -eq 30 ]]; then
    echo "Error: Metro did not start within 60s" >&2
    exit 1
  fi
  sleep 2
done

# ── 6. Run Maestro test ──
echo "→ Running Maestro test..."
maestro test example/.maestro/perf-test.yaml

# ── 7. Pull results ──
echo "→ Pulling perf data from simulator..."
node cli-dist/index.js pull --app-id "$APP_ID" --platform ios

# ── 8. Generate report ──
echo "→ Generating report..."
node cli-dist/index.js report --input "$RESULTS_FILE" --format both

# ── 9. Score gate ──
echo "→ Running score gate (min: $MIN_SCORE)..."
node cli-dist/index.js score --input "$RESULTS_FILE" --min-score "$MIN_SCORE"

echo ""
echo "✅ Perf test complete. Report saved to $RESULTS_DIR/"
