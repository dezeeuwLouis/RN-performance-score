# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Detailed Rules

Read these files before writing code:

- `.claude/docs/architecture.md` — Project structure, package layout, native module conventions
- `.claude/docs/code-rules.md` — Component, hook, import, type, and error handling conventions
- `.claude/docs/git-flow.md` — Branch strategy, workflow, and release process

## Git Rules

- All git operations require explicit user approval
- Read-only commands (git status, git diff, git log) are OK without approval
- Always show what will be done before any git operation
- Conventional Commits: `<type>(<scope>): <subject>` — max 50 chars, imperative mood
- Each commit should only touch one feature — no cross-feature commits
- Destructive operations (force push, hard reset, rebase, checkout ., clean -f) require approval AND warning
- **Never change version numbers** (`package.json`) without explicit user approval — always highlight the old → new version and ask before modifying
- See `.claude/docs/git-flow.md` for branch strategy, merge policy, and full workflow

## Security

- Never commit secrets, API keys, or credentials
- Flag potential security vulnerabilities (XSS, injection, etc.)
- Warn before installing packages with known vulnerabilities

## Code Quality

- Flag functions over 50 lines as candidates for splitting
- Suggest extracting magic numbers into named constants
- Prefer early returns over nested conditionals

## File Organization

Single npm package with native modules and CLI:

```
rn-perf-score/
  src/                                 # Library source (TypeScript, bundled into app)
    index.tsx                          # Public API barrel export
    NativeRnPerfScore.ts               # TurboModule spec (codegen)
    PerfMonitor.tsx                    # <PerfMonitor /> React component
    types.ts                           # Shared TypeScript interfaces
    recorder/                          # FPS measurement
      JsFpsRecorder.ts                 # rAF-based JS thread FPS
      NativeFpsRecorder.ts             # JS wrapper around native UI FPS
      FpsDataStore.ts                  # Aggregates JS + UI FPS
    instrumentation/                   # Auto-instrumentation
      NetworkInterceptor.ts            # fetch/XHR monkey-patching
      NavigationTracker.ts             # React Navigation (optional)
      JsTaskMonitor.ts                 # Long JS task detection
      index.ts                         # Orchestrator
    utils/                             # Shared utilities
  cli/                                 # CLI source (Node.js only, NOT bundled into app)
    index.ts                           # Entry point (commander)
    commands/                          # CLI commands (pull, score, report, compare, baseline)
    report/                            # HTML report generation + score calculation
    transport/                         # Device communication (adb, simctl)
    merge/                             # Step marker merging
    types.ts                           # CLI-specific types
  ios/                                 # Native iOS (ObjC++)
  android/                             # Native Android (Kotlin)
  example/                             # Example RN app for dev/testing
  __tests__/                           # Jest tests
```

- Use camelCase for TypeScript files, kebab-case for config files
- One file = one primary export
- `src/` is for React Native runtime code only — no Node.js APIs
- `cli/` is for Node.js CLI code only — no React Native APIs
- No circular imports between `src/` and `cli/`

## Verification

After any code change, verify:

```bash
npx tsc --noEmit              # Library typecheck
npx tsc --project cli/tsconfig.json --noEmit  # CLI typecheck
npx bob build                 # Library build
npx tsup                      # CLI build
```
