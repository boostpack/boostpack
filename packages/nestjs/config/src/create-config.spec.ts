import Joi from 'joi';
import { expectTypeOf } from 'expect-type';
import { createConfig, setMockEnvValue, clearMockEnvValues } from './create-config';

describe('createConfig', () => {
  describe('type parsing', () => {
    it('should parse string correctly', () => {
      const schema = Joi.object({
        TEST_STRING: Joi.string().required(),
      });

      const config = createConfig(schema, { TEST_STRING: 'hello' });
      const value = config.get('TEST_STRING');

      expect(value).toBe('hello');
      expectTypeOf(value).toEqualTypeOf<string>();
    });

    it('should parse number correctly', () => {
      const schema = Joi.object({
        TEST_NUMBER: Joi.number().required(),
      });

      const config = createConfig(schema, { TEST_NUMBER: '42' });
      const value = config.get('TEST_NUMBER');

      expect(value).toBe(42);
      expectTypeOf(value).toEqualTypeOf<number>();
    });

    it('should parse boolean correctly', () => {
      const schema = Joi.object({
        TEST_BOOL_TRUE: Joi.boolean().required(),
        TEST_BOOL_FALSE: Joi.boolean().required(),
      });

      const config = createConfig(schema, {
        TEST_BOOL_TRUE: 'true',
        TEST_BOOL_FALSE: 'false',
      });

      const valueTrue = config.get('TEST_BOOL_TRUE');
      const valueFalse = config.get('TEST_BOOL_FALSE');

      expect(valueTrue).toBe(true);
      expect(valueFalse).toBe(false);
      expectTypeOf(valueTrue).toEqualTypeOf<boolean>();
      expectTypeOf(valueFalse).toEqualTypeOf<boolean>();
    });
  });

  describe('default values', () => {
    it('should apply default for Joi.string().default()', () => {
      const schema = Joi.object({
        TEST_DEFAULT: Joi.string().default('1000'),
      });

      const config = createConfig(schema, {});
      const value = config.get('TEST_DEFAULT');

      expect(value).toBe('1000');
      expectTypeOf(value).toEqualTypeOf<string>();
    });

    it('should apply default for Joi.string().optional().default()', () => {
      const schema = Joi.object({
        TEST_OPTIONAL_DEFAULT: Joi.string().optional().default('1000'),
      });

      const config = createConfig(schema, {});
      const value = config.get('TEST_OPTIONAL_DEFAULT');

      expect(value).toBe('1000');
      expectTypeOf(value).toEqualTypeOf<string>();
    });

    it('should fail for Joi.string().required().default() without env - default does not satisfy required', () => {
      const schema = Joi.object({
        TEST_REQUIRED_DEFAULT: Joi.string().required().default('1000'),
      });

      expect(() => createConfig(schema, {})).toThrow('Config validation failed');
    });

    it('should override default when value is provided', () => {
      const schema = Joi.object({
        TEST_DEFAULT: Joi.string().default('1000'),
      });

      const config = createConfig(schema, { TEST_DEFAULT: '2000' });
      const value = config.get('TEST_DEFAULT');

      expect(value).toBe('2000');
      expectTypeOf(value).toEqualTypeOf<string>();
    });
  });

  describe('allow empty string', () => {
    it(`should fail for Joi.string().required().allow('') with no env`, () => {
      const schema = Joi.object({
        TEST_ALLOW_EMPTY: Joi.string().required().allow(''),
      });

      expect(() => createConfig(schema, {})).toThrow('Config validation failed');
    });

    it(`should pass for Joi.string().required().allow('') with empty string env`, () => {
      const schema = Joi.object({
        TEST_ALLOW_EMPTY: Joi.string().required().allow(''),
      });

      const config = createConfig(schema, { TEST_ALLOW_EMPTY: '' });
      const value = config.get('TEST_ALLOW_EMPTY');

      expect(value).toBe('');
      expectTypeOf(value).toEqualTypeOf<string>();
    });
  });

  describe('validation errors', () => {
    it('should throw on missing required field', () => {
      const schema = Joi.object({
        REQUIRED_FIELD: Joi.string().required(),
      });

      expect(() => createConfig(schema, {})).toThrow('Config validation failed');
    });

    it('should throw on invalid type', () => {
      const schema = Joi.object({
        TEST_NUMBER: Joi.number().required(),
      });

      expect(() => createConfig(schema, { TEST_NUMBER: 'not-a-number' })).toThrow('Config validation failed');
    });
  });

  describe('getAll', () => {
    it('should return all values as an object', () => {
      const schema = Joi.object({
        HOST: Joi.string().required(),
        PORT: Joi.number().required(),
      });

      const config = createConfig(schema, { HOST: 'localhost', PORT: '3000' });
      const all = config.getAll();

      expect(all).toEqual({ HOST: 'localhost', PORT: 3000 });

      expectTypeOf(all.HOST).toBeString();
      expectTypeOf(all.PORT).toBeNumber();
    });
  });

  describe('mocks', () => {
    afterEach(() => {
      clearMockEnvValues();
    });

    it('should return mocked value instead of validating', () => {
      const schema = Joi.object({
        DATABASE_URL: Joi.string().required(),
      });

      setMockEnvValue('DATABASE_URL', 'mock://localhost');

      const config = createConfig(schema, {});
      const value = config.get('DATABASE_URL');

      expect(value).toBe('mock://localhost');
    });

    it('should throw on unmocked key', () => {
      const schema = Joi.object({
        HOST: Joi.string().required(),
        PORT: Joi.number().required(),
      });

      setMockEnvValue('HOST', 'localhost');

      const config = createConfig(schema, {});

      expect(config.get('HOST')).toBe('localhost');
      expect(() => config.get('PORT')).toThrow('Config key "PORT" is not mocked');
    });

    it('should skip validation when mocks are set', () => {
      const schema = Joi.object({
        REQUIRED_FIELD: Joi.string().required(),
      });

      setMockEnvValue('REQUIRED_FIELD', 'mocked');

      // would throw without mocks since env is empty
      expect(() => createConfig(schema, {})).not.toThrow();
    });

    it('should resume validation after clearing mocks', () => {
      const schema = Joi.object({
        REQUIRED_FIELD: Joi.string().required(),
      });

      setMockEnvValue('REQUIRED_FIELD', 'mocked');
      clearMockEnvValues();

      expect(() => createConfig(schema, {})).toThrow('Config validation failed');
    });

    it('should return mocked values from getAll', () => {
      setMockEnvValue('A', '1');
      setMockEnvValue('B', '2');

      const schema = Joi.object({
        A: Joi.string().required(),
        B: Joi.string().required(),
      });

      const config = createConfig(schema, {});

      expect(config.getAll()).toEqual({ A: '1', B: '2' });
    });
  });
});
