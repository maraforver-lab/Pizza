# Testing

Patch 02 adds the first automated regression test layer for DoughTools.

## Commands

Run all automated tests:

```bash
npm run test
```

Run lint:

```bash
npm run lint
```

Run production build:

```bash
npm run build
```

There is no separate `typecheck` script at the time of Patch 02. The Next.js production build performs TypeScript validation as part of the build pipeline.

## Test framework

The project uses Vitest for fast TypeScript unit tests.

Configuration file:

```text
vitest.config.ts
```

Tests live under:

```text
tests/
```

Fixture data lives under:

```text
tests/fixtures/
```

## Current test scope

- Dough ingredient calculation baseline.
- Yeast and sourdough leavener behavior.
- URL recipe state parsing and serialization.
- Saved recipe localStorage compatibility.
- Pizza style and flour database consistency.
- Lightweight journal entry compatibility.

## Rules for future patches

- When changing calculation behavior intentionally, update `docs/calculation-baseline.md` and the related tests in the same patch.
- When changing persisted data shape, add legacy fixtures before changing loaders.
- Keep tests close to pure functions when possible.
- Do not rely on UI screenshots to validate recipe math.
- Add browser/integration tests before changing IndexedDB photo journal behavior.
