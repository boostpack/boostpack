# @boostpack/joi-extract-type

TypeScript type extraction for Joi schemas via module augmentation.

## Problem

Joi validates data at runtime, but doesn't provide compile-time types for validated values. You end up duplicating your schema as a TypeScript interface:

```typescript
const schema = Joi.object({ name: Joi.string().required(), age: Joi.number() });

// manual duplication
interface Config {
  name: string;
  age?: number;
}
```

This package augments Joi's type definitions so TypeScript can infer the type directly from the schema — no duplication needed.

## Installation

```bash
npm install @boostpack/joi-extract-type
```

`joi` >= 17 is required as a peer dependency.

## Usage

Import the package once (side-effect import) to activate the type augmentation:

```typescript
import '@boostpack/joi-extract-type';
import Joi from 'joi';

const schema = Joi.object({
  host: Joi.string().required(),
  port: Joi.number().default(3000),
  debug: Joi.boolean().optional(),
});

type Config = Joi.extractType<typeof schema>;
// { host: string; port: number; debug?: boolean | undefined }
```

### Required vs optional

Fields are optional by default. Use `.required()` or `.default()` to make them required:

```typescript
const schema = Joi.object({
  name: Joi.string().required(),  // required — always string
  age: Joi.number(),              // optional — number | undefined
  role: Joi.string().default('user'),  // has default — always string
});
```

### Arrays

```typescript
const schema = Joi.object({
  tags: Joi.array().items(Joi.string()).required(),
});

type Result = Joi.extractType<typeof schema>;
// { tags: string[] }
```

### Alternatives

```typescript
const schema = Joi.alternatives(Joi.string(), Joi.number());

type Result = Joi.extractType<typeof schema>;
// string | number
```

## Acknowledgements

Based on the original [joi-extract-type](https://github.com/TCMiranda/joi-extract-type) by [Tiago de Carvalho Miranda](https://github.com/TCMiranda), with fixes from [panzelva](https://gist.github.com/panzelva/b0e565870c950c4cfd77188d69a3064a) and [dp-franklin](https://gist.github.com/panzelva/b0e565870c950c4cfd77188d69a3064a?permalink_comment_id=4446197#gistcomment-4446197).

## License

MIT
