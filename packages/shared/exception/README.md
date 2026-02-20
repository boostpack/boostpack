# @boostpack/exception

Type-safe exception system with [RFC 9457](https://www.rfc-editor.org/rfc/rfc9457) Problem Details support.

## Problem

In complex business logic, exceptions become painful:

- **No structure** — `throw new Error('something went wrong')` loses context. What kind of error? What data was involved? Is it a client mistake or a server bug?
- **No type safety** — `catch (e)` gives you `unknown`. Handling different error cases turns into fragile `instanceof` chains or string matching.
- **No standard for API responses** — every service invents its own error format, making integration harder.

This package solves all three: exceptions carry structured data (`kind`, `type`, `detail`, `data`), support type-safe matching via `mapByException`, and follow RFC 9457 Problem Details out of the box.

## Installation

```bash
npm install @boostpack/exception
```

## Quick start

### Define an exception

```typescript
import { Exception, ExceptionKind } from '@boostpack/exception';

class UserNotFoundException extends Exception({
  name: 'UserNotFoundException',
  kind: ExceptionKind.NotFound,
  problemType: 'user_not_found',
  title: 'User Not Found',
}) {
  constructor(userId: string) {
    super({ detail: `User ${userId} not found` });
  }
}
```

### Throw and catch

```typescript
throw new UserNotFoundException('123');
```

The instance carries both business logic fields and RFC 9457 fields:

```typescript
exception.kind;     // 'not_found' — category for routing/handling
exception.type;     // 'user_not_found' — RFC 9457 problem type identifier
exception.title;    // 'User Not Found'
exception.detail;   // 'User 123 not found'
exception.message;  // 'User 123 not found' (same as detail, for Error compatibility)
```

## Features

### Exception categories (`kind`)

Every exception belongs to a category via `ExceptionKind`. This determines how the exception is handled: HTTP status mapping, retry logic, logging level, etc.

Available kinds: `client_data_validation`, `validation`, `unauthorized`, `forbidden`, `not_found`, `conflict`, `rate_limit`, `internal`.

### RFC 9457 Problem Details (`type`, `title`, `detail`, `instance`)

Exceptions follow [RFC 9457](https://www.rfc-editor.org/rfc/rfc9457) out of the box. The `type` field is a unique problem identifier per exception class (e.g. `user_not_found`). At the HTTP layer, it is typically prefixed as a URI: `/api/problems/user_not_found`.

### Typed data payload (`data`)

Exceptions can carry a typed payload for the client. Pass `dataType` to the factory and the `data` field becomes required and fully typed at compile time.

### Internal metadata (`meta`)

Arbitrary `Record<string, unknown>` for internal use — logging, debugging, tracing. Not typed, not meant for clients.

### Type-safe matching (`mapByException`)

Named exceptions can be matched exhaustively without `instanceof` chains. The compiler ensures all cases are handled and narrows the type in each branch.

## API

### `Exception(options)`

Factory that creates an exception class.

```typescript
Exception({
  name?: string;         // Literal name for type-safe matching
  kind?: ExceptionKind;  // Default: ExceptionKind.Internal
  problemType?: string;  // Default: 'internal_error'
  title?: string;        // Default RFC 9457 title
  dataType?: class;      // Class constructor for typed data
})
```

### Typed data

```typescript
class OrderData {
  constructor(public orderId: string, public total: number) {}
}

class OrderException extends Exception({
  name: 'OrderException',
  kind: ExceptionKind.Validation,
  problemType: 'order_validation',
  dataType: OrderData,
}) {
  constructor(orderId: string, total: number) {
    super({
      detail: `Invalid order ${orderId}`,
      data: new OrderData(orderId, total), // required when dataType is set
    });
  }
}

const e = new OrderException('abc', -5);
e.data.orderId; // string — fully typed
```

### Named exceptions and `mapByException`

```typescript
import { mapByException, getExceptionName } from '@boostpack/exception';

class NotFoundException extends Exception({ name: 'NotFoundException', kind: ExceptionKind.NotFound }) {
  constructor() { super({ detail: 'Not found' }); }
}

class ConflictException extends Exception({ name: 'ConflictException', kind: ExceptionKind.Conflict }) {
  constructor() { super({ detail: 'Conflict' }); }
}

function handle(e: NotFoundException | ConflictException) {
  return mapByException(e, {
    [getExceptionName(NotFoundException)]: (e) => ({ status: 404, detail: e.detail }),
    [getExceptionName(ConflictException)]: (e) => ({ status: 409, detail: e.detail }),
  });
}
```

### Built-in exceptions

```typescript
import { InternalException, NotImplementedException, ForbiddenException } from '@boostpack/exception';

throw new InternalException({ detail: 'Database connection lost', cause: originalError });
throw new NotImplementedException({ detail: 'Feature not available yet' });
throw new ForbiddenException({ detail: 'Insufficient permissions' });
```

### JSON-RPC error code

Attach a JSON-RPC error code to an exception class via the `jsonRpcCode` option. Useful for WebSocket/JSON-RPC APIs where each exception type maps to a numeric code.

```typescript
import { Exception, ExceptionKind, BaseJsonRpcCode } from '@boostpack/exception';

class InvalidOrderException extends Exception({
  kind: ExceptionKind.Validation,
  problemType: 'invalid_order',
  jsonRpcCode: BaseJsonRpcCode.InvalidParams,
}) {
  constructor() {
    super({ detail: 'Invalid order data' });
  }
}

InvalidOrderException.jsonRpcCode; // -32602 (InvalidParams)
```

`BaseJsonRpcCode` provides the five standard JSON-RPC 2.0 codes: `ParseError` (-32700), `InvalidRequest` (-32600), `MethodNotFound` (-32601), `InvalidParams` (-32602), `InternalError` (-32603). Pass any `number` for custom codes.

### Utilities

#### `ExceptionHttpStatusMapper`

Maps `ExceptionKind` to HTTP status codes and back.

```typescript
import { ExceptionHttpStatusMapper, ExceptionKind } from '@boostpack/exception';

ExceptionHttpStatusMapper.getHttpStatus(ExceptionKind.NotFound);  // 404
ExceptionHttpStatusMapper.getHttpStatus(ExceptionKind.Conflict);  // 409
ExceptionHttpStatusMapper.getKind(401); // ExceptionKind.Unauthorized
ExceptionHttpStatusMapper.getKind(418); // ExceptionKind.Internal (fallback)
```

#### `generateProblemType(className)`

Generates a `problemType` slug from a class name.

```typescript
generateProblemType('UserNotFoundException');           // 'user_not_found'
generateProblemType('ExchangeAmountValidationException'); // 'exchange_amount_validation'
```

#### `formatTitleFromClassName(className)`

Generates a human-readable title from a class name.

```typescript
formatTitleFromClassName('UserNotFoundException');           // 'User not found'
formatTitleFromClassName('ExchangeAmountValidationException'); // 'Exchange amount validation'
```

## License

MIT