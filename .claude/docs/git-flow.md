# Git Flow

## Branch Strategy

GitHub Flow — simple and linear:

```
main ← always stable, always publishable
  │
  ├── feat/js-fps-recorder        ← feature branches
  ├── fix/android-choreographer    ← bug fix branches
  └── chore/update-deps            ← maintenance branches
```

No `develop`, no `staging`, no `release/*` branches.

## Daily Workflow

```
1. Create branch:    git checkout -b feat/feature-name
2. Work + commit:    Small atomic commits (1-5 files each)
3. Push + PR:        Push branch, create PR to main
4. Review + merge:   Regular merge (no squash)
5. Clean up:         Pull main, delete merged branches
```

## Branch Naming

Match the commit type:

- `feat/short-description` — new features
- `fix/short-description` — bug fixes
- `refactor/short-description` — code refactoring
- `chore/short-description` — maintenance

## Commit Messages

Conventional Commits: `<type>(<scope>): <subject>`

**Types:** feat, fix, docs, style, refactor, test, chore

**Scopes (examples):**
- `feat(recorder)` — FPS recorder changes
- `fix(ios)` — iOS native module fix
- `fix(android)` — Android native module fix
- `feat(cli)` — CLI changes
- `feat(report)` — HTML report changes
- `refactor(instrumentation)` — Auto-instrumentation changes
- `test(score)` — Score calculation tests

**Rules:**
- Subject line: max 50 characters, imperative mood ("add" not "added")
- Body: wrap at 72 characters, explain "what" and "why"
- One logical change per commit
- Each commit should leave the codebase in a buildable state

## Merge Strategy

Use **regular merge** (no squash). This preserves all atomic commits on main, allowing:

- Surgical reverts of individual commits
- Precise `git bisect` to find which commit introduced a bug
- Full traceability of changes

## Tagging Releases

When publishing to npm:

```bash
git tag -a v0.1.0 -m "Initial release"
git push origin v0.1.0
```

## Verification Before Push

Every push should pass:

- TypeScript typecheck (`npx tsc --noEmit` + `npx tsc --project cli/tsconfig.json --noEmit`)
- Library build (`npx bob build`)
- CLI build (`npx tsup`)
- Tests (`npx jest`)
