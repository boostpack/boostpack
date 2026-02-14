# @boostpack/error

Utilities for working with errors in TypeScript.

## Installation

```bash
npm install @boostpack/error
```

## API

### `toError(error: unknown): Error`

Safely converts any `unknown` value to an `Error` instance.

When [`useUnknownInCatchVariables`](https://www.typescriptlang.org/tsconfig/#useUnknownInCatchVariables) is enabled (included in `strict` mode), TypeScript types `catch` variables as `unknown` instead of `any`. This makes direct access to `.message` or `.stack` a type error:

```typescript
try {
  await someOperation();
} catch (e) {
  console.error(e.message); // TS18046: 'e' is of type 'unknown'
}
```

`toError` provides a safe and ergonomic way to handle this:

```typescript
import { toError } from '@boostpack/error';

try {
  await someOperation();
} catch (e) {
  const error = toError(e);
  console.error(error.message);
}

// or inline
try {
  await someOperation();
} catch (e) {
  logger.error(toError(e).message);
}
```

**Behavior:**

- `Error` instance — returned as-is (including subclasses like `TypeError`)
- Other values — wrapped in `new Error()` with JSON-serialized representation; original value is preserved in `error.cause`
- Non-serializable values (circular references) — wrapped with a fallback message; original value is still available via `error.cause`

```typescript
const result = toError({ code: 'TIMEOUT' });
result.message; // 'Unknown error: {"code":"TIMEOUT"}'
result.cause;   // { code: 'TIMEOUT' } — original value
```

## License

MIT