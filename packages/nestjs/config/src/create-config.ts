import Joi from 'joi';
import '@boostpack/joi-extract-type';

export interface Config<T> {
  get<K extends keyof T = keyof T>(key: K): T[K];
  getAll(): T;
}

const mockEnvValues: Record<string, unknown> = {};

export function setMockEnvValue(key: string, value: unknown): void {
  mockEnvValues[key] = value;
}

export function clearMockEnvValues(): void {
  Object.keys(mockEnvValues).forEach((key) => delete mockEnvValues[key]);
}

function hasMocks(): boolean {
  return Object.keys(mockEnvValues).length > 0;
}

/**
 * Creates a type-safe configuration object with runtime validation
 * @param schema - Joi validation schema
 * @param env - Environment variables (defaults to process.env)
 * @returns Type-safe config accessor
 * @throws Error if validation fails
 */
export function createConfig<T extends Record<string, unknown>>(
  schema: Joi.ObjectSchema | Joi.BoxObjectSchema<Joi.Box<T, boolean>>,
  env: Record<string, unknown> = process.env,
): Config<T> {
  if (hasMocks()) {
    return {
      get<K extends keyof T>(key: K): T[K] {
        if (String(key) in mockEnvValues) {
          return mockEnvValues[String(key)] as T[K];
        }

        throw new Error(
          `Config key "${String(key)}" is not mocked. Use setMockEnvValue('${String(key)}', value) to mock it.`,
        );
      },
      getAll(): T {
        return { ...mockEnvValues } as T;
      },
    };
  }

  const result = schema.validate(env, {
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: { objects: true },
  }) as Joi.ValidationResult<T>;

  if (result.error !== undefined) {
    throw new Error(`Config validation failed: ${result.error.message}`);
  }

  const { value } = result;

  return {
    get(key: keyof T) {
      return value[key];
    },
    getAll() {
      return value;
    },
  } as Config<T>;
}
