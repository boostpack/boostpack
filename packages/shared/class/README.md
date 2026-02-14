# @boostpack/class

Utilities for working with classes in TypeScript.

## Installation

```bash
npm install @boostpack/class
```

## API

### `ClassConstructor<T>`

Represents any class constructor (including abstract classes) that produces an instance of type `T`.

```typescript
import { ClassConstructor } from '@boostpack/class';

function create<T>(ctor: ClassConstructor<T>, ...args: unknown[]): T {
  return new (ctor as new (...a: unknown[]) => T)(...args);
}

class UserService {}

const instance = create(UserService); // UserService
```

### `OptionalClassConstructor<T>`

A class constructor that may be `undefined`. Useful for optional dependency injection or conditional class resolution.

```typescript
import { OptionalClassConstructor } from '@boostpack/class';

function resolveOptional<T>(ctor: OptionalClassConstructor<T>): T | undefined {
  return ctor ? new (ctor as new () => T)() : undefined;
}

const Logger: OptionalClassConstructor<Console> = undefined;
resolveOptional(Logger); // undefined
```

### `OptionalClassInstance<C>`

Conditionally resolves to `InstanceType<C>` if `C` is a constructable class, otherwise `undefined`. Works at the type level for generic programming.

```typescript
import { OptionalClassInstance } from '@boostpack/class';

class Config {}

type A = OptionalClassInstance<typeof Config>; // Config
type B = OptionalClassInstance<string>;        // undefined
```

## License

MIT