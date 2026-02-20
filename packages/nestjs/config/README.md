# @boostpack/nestjs-config

Type-safe environment configuration with Joi validation for NestJS.

## Problem

`@nestjs/config` has four pain points:

1. **Validation on import** — config is validated at import time, which breaks tests and complicates lazy loading.
2. **No type safety** — `configService.get('KEY')` returns `unknown`, forcing you to duplicate schema types manually.
3. **Testing is painful** — mocking `ConfigService` is verbose, and there's no way to see which env vars your code actually needs.
4. **Boilerplate** — requires module registration (`ConfigModule.forRoot()`), injection, and `ConfigService` — all for a simple key-value lookup.

This package solves all: validation happens when you call `createConfig()`, types are inferred directly from the Joi schema, and the built-in mock system shows exactly which keys are accessed — unmocked keys throw a descriptive error, making it easy to catch missing env vars in tests.

While originally designed as a `@nestjs/config` replacement, the package has no NestJS dependency and works in any Node.js project.

## Comparison

### Before — `@nestjs/config`

```typescript
// app.module.ts — register the module
@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
})
export class AppModule {}

// database-config.service.ts — typed wrapper over ConfigService
@Injectable()
export class DatabaseConfigService {
  constructor(private readonly configService: ConfigService) {}

  get host(): string {
    return this.configService.get<string>('DB_HOST');          // string | undefined, no guarantee
  }

  get port(): number {
    return +(this.configService.get<string>('DB_PORT'));        // manual number conversion
  }

  get ssl(): boolean {
    return this.configService.get('DB_SSL') === 'true';        // manual boolean conversion
  }
}

// database-config.module.ts — register the wrapper
@Module({
  providers: [DatabaseConfigService],
  exports: [DatabaseConfigService],
})
export class DatabaseConfigModule {}
```

### After — `@boostpack/nestjs-config`

```typescript
// database-config.service.ts — schema + accessors in one place
@Injectable()
export class DatabaseConfigService {
  private readonly config = createConfig(
    Joi.object({
      DB_HOST: Joi.string().required(),
      DB_PORT: Joi.number().required(),
      DB_SSL: Joi.boolean().default(false),
    }),
  );

  get host(): string {
    return this.config.get('DB_HOST'); // string — guaranteed, validated
  }

  get port(): number {
    return this.config.get('DB_PORT'); // number — already converted by Joi
  }

  get ssl(): boolean {
    return this.config.get('DB_SSL');  // boolean — already converted by Joi
  }
}
```

No `ConfigModule.forRoot()`, no `ConfigService` injection, no manual type casting. Types are inferred from the Joi schema — no duplication needed.

## Installation

```bash
npm install @boostpack/nestjs-config joi
```

## Usage

```typescript
import Joi from 'joi';
import { createConfig } from '@boostpack/nestjs-config';

const appConfig = createConfig(
  Joi.object({
    HOST: Joi.string().default('localhost'),
    PORT: Joi.number().required(),
    DEBUG: Joi.boolean().default(false),
  }),
);

appConfig.get('HOST');  // string
appConfig.get('PORT');  // number
appConfig.get('DEBUG'); // boolean
appConfig.getAll();     // { HOST: string; PORT: number; DEBUG: boolean }
```

Keys are validated at compile time — `appConfig.get('TYPO')` is a type error.

### Required, optional, default

```typescript
Joi.string().required()    // string — must be in env
Joi.number()               // number | undefined — can be missing
Joi.string().default('x')  // string — Joi fills the default if missing
```

`.default()` makes the field always present — if the env var is missing, Joi substitutes the default value. The type reflects this: `string`, not `string | undefined`. Note that `.required().default()` still requires the env var to be set — the default is ignored.

### Testing with mocks

Mocks bypass validation entirely — no real env vars needed:

```typescript
import { setMockEnvValue, clearMockEnvValues } from '@boostpack/nestjs-config';

beforeEach(() => {
  setMockEnvValue('DATABASE_URL', 'mock://localhost');
});

afterEach(() => {
  clearMockEnvValues();
});
```

When mocks are active, `createConfig()` skips Joi validation and returns mocked values. Accessing an unmocked key throws with a descriptive error.

## API

### `createConfig(schema, env?)`

Creates a type-safe config from a Joi object schema.

- `schema` — `Joi.object({ ... })` with your env var definitions
- `env` — environment source (defaults to `process.env`)
- Throws `Error` if validation fails

Returns `Config<T>` with:
- `get(key)` — returns the value for a single key
- `getAll()` — returns all validated values as an object

### `setMockEnvValue(key, value)`

Sets a mock value for testing. While any mocks are set, all `createConfig()` calls skip validation.

### `clearMockEnvValues()`

Clears all mocks, restoring normal validation behavior.

## License

MIT
