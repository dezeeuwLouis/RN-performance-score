# Architecture

## Project Structure

```
rn-perf-score/
│
├── package.json                    ← Single package (library + CLI)
├── tsconfig.json                   ← Root tsconfig (library)
├── tsconfig.build.json             ← Build config (excludes cli, example)
├── tsup.config.ts                  ← CLI bundler config
├── RnPerfScore.podspec             ← iOS CocoaPods spec
│
├── src/                            ← Library source (React Native runtime)
│   ├── index.tsx                   ← Public API (PerfScore singleton)
│   ├── NativeRnPerfScore.ts        ← TurboModule codegen spec
│   ├── PerfMonitor.tsx             ← <PerfMonitor /> React component
│   ├── types.ts                    ← Shared type definitions
│   ├── recorder/                   ← FPS measurement core
│   │   ├── JsFpsRecorder.ts        ← requestAnimationFrame-based JS FPS
│   │   ├── NativeFpsRecorder.ts    ← NativeEventEmitter wrapper for UI FPS
│   │   └── FpsDataStore.ts         ← Timestamped sample aggregator
│   ├── instrumentation/            ← Auto-instrumentation (Layer 1)
│   │   ├── NetworkInterceptor.ts   ← fetch/XHR monkey-patching
│   │   ├── NavigationTracker.ts    ← React Navigation event listener
│   │   ├── JsTaskMonitor.ts        ← rAF gap detection (>16ms)
│   │   └── index.ts                ← Orchestrator
│   └── utils/
│       ├── fileWriter.ts           ← Write JSON via native module
│       └── timestamp.ts            ← Timestamp utilities
│
├── cli/                            ← CLI source (Node.js only)
│   ├── index.ts                    ← Entry point (commander)
│   ├── types.ts                    ← CLI-specific types (mirrors src/types.ts)
│   ├── commands/
│   │   ├── pull.ts                 ← Pull data from device (adb/simctl)
│   │   ├── score.ts                ← Calculate + display score
│   │   ├── report.ts               ← Generate HTML/JSON report
│   │   ├── compare.ts              ← Regression detection vs baseline
│   │   └── baseline.ts             ← Save current run as baseline
│   ├── report/
│   │   ├── htmlTemplate.ts         ← Self-contained HTML report generator
│   │   ├── chartRenderer.ts        ← Canvas 2D chart data preparation
│   │   └── scoreCalculator.ts      ← Score computation + formatting
│   ├── transport/
│   │   ├── adb.ts                  ← Android adb pull wrapper
│   │   ├── simctl.ts               ← iOS xcrun simctl wrapper
│   │   └── detect.ts               ← Auto-detect platform
│   └── merge/
│       └── stepMerger.ts           ← Parse perf-steps.log + merge with FPS data
│
├── ios/                            ← Native iOS (ObjC++)
│   ├── RnPerfScore.h               ← Header (extends RCTEventEmitter)
│   └── RnPerfScore.mm              ← Implementation (CADisplayLink FPS + file I/O)
│
├── android/                        ← Native Android (Kotlin)
│   └── src/main/java/com/rnperfscore/
│       ├── RnPerfScoreModule.kt    ← Native module (Choreographer FPS + file I/O)
│       └── RnPerfScorePackage.kt   ← React package registration
│
├── example/                        ← Example React Native app
│   └── src/App.tsx
│
└── __tests__/                      ← Jest unit tests
```

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Language | TypeScript | Library + CLI source |
| Native (iOS) | ObjC++ | TurboModule + CADisplayLink FPS tracking |
| Native (Android) | Kotlin | TurboModule + Choreographer FPS tracking |
| Library build | react-native-builder-bob | CJS + ESM + type definitions |
| CLI build | tsup (esbuild) | Single CJS bundle for Node.js |
| CLI framework | commander | Command parsing + help generation |
| Chart rendering | Canvas 2D (no deps) | Self-contained HTML report |
| Testing | Jest | Unit tests |

## Native Module Architecture

The TurboModule (`NativeRnPerfScore.ts`) defines the JS↔Native bridge:

- `startRecording(sampleIntervalMs)` — Start UI thread FPS tracking
- `stopRecording()` — Stop tracking
- `isRecording()` — Check state
- `writeResultFile(filename, jsonContent)` — Write JSON to device filesystem
- `getResultFilePath(filename)` — Get absolute path for a result file
- Native emits `onUiFpsSample` events via `NativeEventEmitter`

### iOS Implementation
- `CADisplayLink` added to main run loop in `NSRunLoopCommonModes`
- Frame count accumulated per sampling interval
- FPS = frameCount / elapsed, capped at 60
- Files written to app's `Documents/` directory

### Android Implementation
- `Choreographer.FrameCallback` posted on UI thread
- Frame count accumulated per sampling interval
- FPS = frameCount / elapsed, capped at 60
- Files written to app's `filesDir`

## Data Flow

```
App starts recording
  ├── Native module → CADisplayLink/Choreographer → emits UI FPS samples
  ├── JS module → requestAnimationFrame loop → measures JS FPS
  ├── Auto-instrumentation → captures network/navigation/long tasks
  └── FpsDataStore aggregates everything into timestamped samples

App stops recording
  └── JSON written to device filesystem

CLI pulls data
  ├── adb pull (Android) or file copy from simulator container (iOS)
  ├── Merges perf-steps.log (test step markers) by timestamp
  ├── Calculates score: (avgJsFps/target + avgUiFps/target) / 2 * 100
  └── Generates HTML report with FPS curves + event annotations
```

## Build Commands

```bash
npx bob build     # Build library (src/ → lib/)
npx tsup          # Build CLI (cli/ → cli-dist/)
yarn prepare      # Both (runs automatically on install)
```

## Boundary Rules

- `src/` NEVER imports from `cli/` or Node.js built-ins (`fs`, `path`, `child_process`)
- `cli/` NEVER imports from `src/` (types are duplicated in `cli/types.ts`)
- `ios/` and `android/` implement the TurboModule spec defined in `src/NativeRnPerfScore.ts`
- The `example/` app imports only from `rn-perf-score` (the published package surface)
