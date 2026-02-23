# Code Rules

## Component Rules

- ~200 lines guideline (signal, not hard limit)
- Single responsibility — one component = one clear purpose
- Extract logic to hooks — render logic only
- No inline sub-components — extract to separate files

## Prop Naming

- Booleans: `is`, `has`, `can`, `should` prefix
- Arrays: plural names
- Handlers: `on` prefix
- Render props: `render` prefix

## Hook Rules

- Split by concern — one hook = one domain/feature
- No "god hooks"
- ~300 lines guideline
- `use{Domain}{Action}` naming pattern
- Functions without hooks inside should NOT have `use` prefix
- Return typed objects
- Co-locate single-use hooks; move to shared when used by 2+ modules

## Import Rules

- No barrel files (`index.ts` re-exports) except `src/index.tsx` (public API) and `src/instrumentation/index.ts` (orchestrator)
- Direct imports — always import from source file
- No chained re-exports
- Explicit full file paths
- Import order: React/React Native → External packages → Internal absolute → Relative → Types

## Type Organization

- Shared types for the library live in `src/types.ts`
- CLI types live in `cli/types.ts` (mirrors library types for JSON parsing)
- TurboModule spec types live in `src/NativeRnPerfScore.ts`
- No `any` — use `unknown` and narrow
- No `@ts-ignore` or `@ts-expect-error`
- No type assertions (`as`) unless absolutely unavoidable

## TypeScript Strictness

- `strict: true` — never override to `false`
- `noUnusedLocals: true`
- `noUnusedParameters: true`
- `noUncheckedIndexedAccess: true`
- Prefix intentionally unused params with `_`

## Error Handling

- Try-catch in async code
- User-friendly errors in CLI (clear messages, not stack traces)
- Native module errors should log with `[rn-perf-score]` prefix
- CLI exits with non-zero code on failure (`process.exit(1)`)
- Graceful degradation — if auto-instrumentation fails, FPS recording continues

## Native Code Rules

### iOS (ObjC++)
- Implementation in `.mm` files (ObjC++ for TurboModule compatibility)
- Header files (`.h`) define the interface
- Use `dispatch_async(dispatch_get_main_queue(), ...)` for UI thread work
- CADisplayLink must be on main run loop with `NSRunLoopCommonModes`
- File I/O uses `NSDocumentDirectory`

### Android (Kotlin)
- Main module extends the generated `NativeRnPerfScoreSpec`
- UI thread work via `reactApplicationContext.runOnUiQueueThread`
- Choreographer callbacks for frame counting
- File I/O uses `reactApplicationContext.filesDir`
- Event emission via `RCTDeviceEventEmitter`

## CLI Code Rules

- Each command in its own file in `cli/commands/`
- Commands are pure functions that take an options object
- Transport layer (`cli/transport/`) wraps `adb` and `simctl` commands
- Report generation produces self-contained HTML (no external dependencies)
- All CLI output goes to `console.log` (stdout) or `console.error` (stderr)
- Use `process.exit(1)` for failures, `process.exit(0)` (implicit) for success

## Constants & Configuration

- No magic numbers/strings
- Default config values defined in `src/types.ts` (`DEFAULT_CONFIG`)
- CLI default values defined in commander option declarations
- Named timing constants (e.g., `LONG_TASK_THRESHOLD_MS`)

## Testing

- Test files in `__tests__/` at project root
- Test files mirror source: `JsFpsRecorder.ts` → `__tests__/JsFpsRecorder.test.ts`
- Mock native modules in JS tests
- CLI tests use fixture JSON files
- Pure function tests need no mocking
