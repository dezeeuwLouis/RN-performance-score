# rn-perf-score

Measure JS and UI thread FPS in React Native apps, generate performance scores, and track regressions.

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## Features

- **Dual-thread FPS measurement** — JS thread (requestAnimationFrame) and UI thread (CADisplayLink / Choreographer)
- **Auto-instrumentation** — network requests, navigation events, and long JS tasks captured automatically
- **Performance score** — single 0–100 number combining both threads
- **CLI tooling** — pull data from devices, generate HTML reports, compare against baselines
- **Maestro E2E** — run automated perf tests with score gates in CI
- **Declarative & imperative APIs** — `<PerfMonitor>` component or `PerfScore` singleton

## Quick Start

```bash
# Install
npm install rn-perf-score
cd ios && pod install

# In your app — record performance
import { PerfScore } from 'rn-perf-score';

PerfScore.start();
// ... interact with the app ...
const report = PerfScore.stopAndSave();
console.log(`Score: ${report.score}/100`);

# Pull data and generate a report
npx rn-perf-score pull --app-id com.yourapp
npx rn-perf-score report --input ./perf-results/rn-perf-score-results.json --open
```

## Installation

```bash
npm install rn-perf-score
# or
yarn add rn-perf-score
```

For iOS, install CocoaPods:

```bash
cd ios && pod install
```

Android auto-links — no extra steps needed.

> **React Native < 0.73**: If autolinking doesn't work, follow the [manual linking guide](https://reactnative.dev/docs/linking-libraries-ios) for the native module.

## Usage

### Declarative (PerfMonitor component)

Drop `<PerfMonitor>` into your component tree. Recording starts on mount and stops on unmount, automatically saving results to the device filesystem.

```tsx
import { PerfMonitor } from 'rn-perf-score';

function App() {
  return (
    <>
      <PerfMonitor
        sampleIntervalMs={100}
        targetFps={60}
        enableAutoInstrumentation={true}
        outputFilename="my-perf-results.json"
        onComplete={(report) => console.log('Score:', report.score)}
      />
      {/* your app */}
    </>
  );
}
```

### Imperative (PerfScore singleton)

For fine-grained control, use the `PerfScore` singleton directly.

```ts
import { PerfScore } from 'rn-perf-score';

// Start recording
PerfScore.start({ enableAutoInstrumentation: true });

// Add custom markers at key moments
PerfScore.mark('list_scroll_start');
// ... user scrolls ...
PerfScore.mark('list_scroll_end');

// Stop and save to device filesystem
const report = PerfScore.stopAndSave();
// report.score → 0–100

// Or stop without saving (returns raw samples)
const samples = PerfScore.stop();
```

#### Available methods

| Method | Description |
|---|---|
| `start(config?)` | Begin recording FPS on both threads |
| `stop()` | Stop recording, return `FpsSample[]` |
| `stopAndSave(filename?)` | Stop, build report, write to device filesystem, return `PerfReport` |
| `mark(label, metadata?)` | Add a custom event marker at the current timestamp |
| `addEvent(event)` | Add a raw `PerfEvent` |
| `configure(config)` | Update config without starting |
| `isRecording()` | Returns `true` if currently recording |
| `attachNavigation(ref)` | Attach React Navigation ref for automatic screen tracking |

### Auto-instrumentation

When `enableAutoInstrumentation` is `true` (the default), the library automatically captures:

| Event type | What it captures |
|---|---|
| `network_start` / `network_end` | Every `fetch()` call — method, URL, status code, duration |
| `long_task` | JS thread blocked for >100ms — reports gap duration |
| `navigation` | Screen changes (requires `attachNavigation()` — see below) |

Events appear in the `events` array of each `FpsSample` and are overlaid on the HTML report timeline.

### React Navigation integration

To track screen transitions, pass your navigation container ref:

```tsx
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { PerfScore } from 'rn-perf-score';

function App() {
  const navigationRef = useNavigationContainerRef();

  useEffect(() => {
    PerfScore.attachNavigation(navigationRef);
  }, [navigationRef]);

  return (
    <NavigationContainer ref={navigationRef}>
      {/* screens */}
    </NavigationContainer>
  );
}
```

## CLI Reference

The CLI ships as `npx rn-perf-score <command>`.

### `pull`

Pull performance data from a connected device or simulator.

```bash
npx rn-perf-score pull --app-id com.yourapp [options]
```

| Flag | Required | Default | Description |
|---|---|---|---|
| `--app-id <id>` | Yes | — | App bundle identifier |
| `--platform <platform>` | No | auto-detect | `ios` or `android` |
| `--device-id <id>` | No | — | Specific device/simulator ID |
| `--output <dir>` | No | `./perf-results` | Output directory |
| `--filename <name>` | No | `rn-perf-score-results.json` | Result filename |

### `score`

Calculate and display the performance score.

```bash
npx rn-perf-score score --input ./perf-results/rn-perf-score-results.json [options]
```

| Flag | Required | Default | Description |
|---|---|---|---|
| `--input <path>` | Yes | — | Path to performance data JSON |
| `--steps <path>` | No | — | Path to `perf-steps.log` for step markers |
| `--min-score <n>` | No | — | Minimum passing score (exit 1 if below) |
| `--fps-threshold <n>` | No | — | Minimum average FPS (exit 1 if below) |
| `--json` | No | — | Output as JSON |

### `report`

Generate an HTML and/or JSON performance report.

```bash
npx rn-perf-score report --input ./perf-results/rn-perf-score-results.json [options]
```

| Flag | Required | Default | Description |
|---|---|---|---|
| `--input <path>` | Yes | — | Path to performance data JSON |
| `--steps <path>` | No | — | Path to `perf-steps.log` for step markers |
| `--format <format>` | No | `both` | `html`, `json`, or `both` |
| `--output <path>` | No | — | Output file path (without extension) |
| `--open` | No | — | Open HTML report in browser after generation |

### `compare`

Compare a performance run against a saved baseline.

```bash
npx rn-perf-score compare --input ./perf-results/rn-perf-score-results.json [options]
```

| Flag | Required | Default | Description |
|---|---|---|---|
| `--input <path>` | Yes | — | Path to current run JSON |
| `--baseline <path>` | No | `.perf-baseline.json` | Path to baseline file |
| `--max-regression <n>` | No | `5` | Max allowed score regression points |
| `--json` | No | — | Output as JSON |

### `baseline`

Save a performance run as the baseline for future comparisons.

```bash
npx rn-perf-score baseline --input ./perf-results/rn-perf-score-results.json [options]
```

| Flag | Required | Default | Description |
|---|---|---|---|
| `--input <path>` | Yes | — | Path to run JSON to save as baseline |
| `--output <path>` | No | `.perf-baseline.json` | Baseline file path |

## Scoring

The performance score is a single number from 0 to 100:

```
score = round((min(avgJsFps/targetFps, 1) * 100 + min(avgUiFps/targetFps, 1) * 100) / 2)
```

Both threads are weighted equally. The default `targetFps` is 60.

### Thresholds

| Score | Rating |
|---|---|
| >= 80 | Good |
| >= 50 | Warning |
| < 50 | Fail |

### Dropped frames

A sample is counted as a "dropped frame" when FPS falls below 90% of the target (i.e., below 54 FPS at a 60 FPS target).

## E2E Testing with Maestro

The repo includes a Maestro flow and orchestration script for automated perf testing:

```bash
# Full automated test: build, install, run Maestro, pull data, report, score gate
bash scripts/run-perf-test.sh
```

The script:
1. Builds the CLI and example app
2. Boots an iOS Simulator (if needed)
3. Installs the app and starts Metro
4. Runs `example/.maestro/perf-test.yaml`
5. Pulls results, generates a report, and applies a score gate (`--min-score 50`)

See `example/.maestro/perf-test.yaml` for the Maestro flow definition.

## Configuration

All options can be passed to `PerfScore.start()`, `PerfScore.configure()`, or as props on `<PerfMonitor>`.

| Option | Type | Default | Description |
|---|---|---|---|
| `sampleIntervalMs` | `number` | `100` | How often to sample FPS (milliseconds) |
| `targetFps` | `number` | `60` | Target frame rate for scoring |
| `enableAutoInstrumentation` | `boolean` | `true` | Capture network, navigation, and long task events |
| `outputFilename` | `string` | `rn-perf-score-results.json` | Filename when saving results to device |

## API Reference

### Types

#### `FpsSample`

```ts
interface FpsSample {
  timestamp: number;
  jsFps: number;
  uiFps: number;
  events: PerfEvent[];
}
```

#### `PerfEvent`

```ts
interface PerfEvent {
  timestamp: number;
  type: PerfEventType;
  label: string;
  duration?: number;
  metadata?: Record<string, unknown>;
}

type PerfEventType = 'navigation' | 'network_start' | 'network_end' | 'long_task' | 'custom';
```

#### `PerfReport`

```ts
interface PerfReport {
  version: number;
  deviceInfo: DeviceInfo;
  startTime: number;
  endTime: number;
  sampleIntervalMs: number;
  targetFps: number;
  samples: FpsSample[];
  steps: StepMarker[];
  score: number;
  avgJsFps: number;
  avgUiFps: number;
  minJsFps: number;
  minUiFps: number;
  droppedFramesJs: number;
  droppedFramesUi: number;
}
```

#### `DeviceInfo`

```ts
interface DeviceInfo {
  platform: 'ios' | 'android';
  model: string;
  osVersion: string;
  appId: string;
}
```

#### `StepMarker`

```ts
interface StepMarker {
  timestamp: number;
  label: string;
}
```

## Example App

The `example/` directory contains a working React Native app that demonstrates both manual recording and an automated scenario (scroll, heavy JS, network requests).

```bash
# Install dependencies
yarn

# Run on iOS
yarn example ios

# Run on Android
yarn example android
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, build commands, and guidelines.

## License

MIT
