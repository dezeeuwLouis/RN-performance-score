# Contributing

Contributions are always welcome, no matter how large or small!

We want this community to be friendly and respectful to each other. Please follow it in all your interactions with the project. Before contributing, please read the [code of conduct](./CODE_OF_CONDUCT.md).

## Project structure

This is a single npm package (not a monorepo) with Yarn workspaces used only for the example app:

- **Root** — the library package (React Native TurboModule with Old Arch fallback)
- **`example/`** — a React Native app for development and testing
- **`src/`** — library source (TypeScript, bundled by Metro into the app at runtime)
- **`cli/`** — CLI source (TypeScript, built by tsup into `cli-dist/`)
- **`ios/`** — native iOS module (ObjC++ using CADisplayLink for UI FPS)
- **`android/`** — native Android module (Kotlin using Choreographer for UI FPS)

For a deeper dive into the architecture, see `.claude/docs/architecture.md`.

## Development workflow

### Prerequisites

- Node.js (see `.nvmrc` for the version used in this project)
- Yarn 4 (`packageManager` is set in `package.json`)
- Xcode (for iOS) / Android Studio (for Android)
- [Maestro CLI](https://maestro.mobile.dev) (for E2E tests)

### Setup

```sh
yarn
```

> Since the project uses Yarn workspaces, you cannot use `npm` for development.

### Building

The library has two separate build outputs:

```sh
# Build the React Native library (output: lib/)
npx bob build

# Build the CLI (output: cli-dist/)
yarn build:cli

# Build both (runs on install via prepare script)
yarn prepare
```

### Running the example app

The [example app](./example/) demonstrates library usage. It uses the local version of the library, so any JavaScript changes are reflected immediately. Native code changes require a rebuild.

```sh
# Start Metro
yarn example start

# Run on iOS
yarn example ios

# Run on Android
yarn example android
```

### Editing native code

**iOS**: Open `example/ios/RnPerfScoreExample.xcworkspace` in Xcode. Find the library source at `Pods > Development Pods > rn-perf-score`.

**Android**: Open `example/android` in Android Studio. Find the library source under `rn-perf-score` in the Android project view.

## Verification checklist

Before submitting a pull request, make sure everything passes:

```sh
# TypeScript (library)
npx tsc --noEmit

# TypeScript (CLI)
npx tsc --project cli/tsconfig.json --noEmit

# Linting
yarn lint

# Library build
npx bob build

# CLI build
npx tsup
```

## Running E2E tests with Maestro

The project includes a Maestro flow for automated performance testing on iOS Simulator:

```sh
# Full orchestrated test (build, install, run, pull, report, score gate)
bash scripts/run-perf-test.sh
```

This script:
1. Builds the CLI and example app
2. Boots an iOS Simulator if none is running
3. Installs the app and starts Metro
4. Runs the Maestro flow at `example/.maestro/perf-test.yaml`
5. Pulls performance data, generates an HTML report, and applies a score gate

To run the Maestro flow manually (after the app is already running):

```sh
maestro test example/.maestro/perf-test.yaml
```

## Scripts reference

| Script | Description |
|---|---|
| `yarn` | Install all dependencies |
| `yarn prepare` | Build library + CLI (runs automatically on install) |
| `yarn build:cli` | Build CLI only (tsup) |
| `yarn typecheck` | Type-check library with TypeScript |
| `yarn lint` | Lint all files with ESLint |
| `yarn lint --fix` | Auto-fix lint errors |
| `yarn example start` | Start Metro for the example app |
| `yarn example ios` | Run example app on iOS |
| `yarn example android` | Run example app on Android |

## Sending a pull request

> **Working on your first pull request?** You can learn how from this _free_ series: [How to Contribute to an Open Source Project on GitHub](https://app.egghead.io/playlists/how-to-contribute-to-an-open-source-project-on-github).

When you're sending a pull request:

- Prefer small pull requests focused on one change.
- Verify that the [verification checklist](#verification-checklist) passes.
- Review the documentation to make sure it looks good.
- Follow the pull request template when opening a pull request.
- For pull requests that change the API or implementation, discuss with maintainers first by opening an issue.
