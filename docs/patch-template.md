# Codex patch template

```text
===== CODEX PATCH START =====

# Patch NNN: Title

Start from the latest `master`.

Follow `AGENTS.md`.

## Goal

One precise outcome.

## Read first

- relevant plan or audit, if one exists
- relevant source files

## Implement

- concrete change
- concrete change
- concrete change

## Do not change

- important boundary
- unrelated systems

## Acceptance criteria

1. User-visible or technical behavior is correct.
2. Existing related behavior remains intact.
3. No duplicate implementation is introduced.

## Validation

Run only risk-relevant validation:

- focused affected tests
- broader tests only when shared logic changed
- lint/build only when relevant
- `git diff --check`

Do not repeat validation already completed for the exact unchanged commit.

## Git

Branch:

`patch/...`

Commit:

`Patch NNN: ...`

After successful validation:

- commit automatically
- fast-forward merge and push when explicitly requested
- do not deploy
- leave `supabase/.temp/` untouched

## Final report

Report:

- commits
- changed files
- implemented behavior
- validation run or reused
- final Git status

===== CODEX PATCH END =====
```
