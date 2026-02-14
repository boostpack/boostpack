import { toError } from './to-error';

describe('toError', () => {
  it('should return the same Error instance', () => {
    const error = new Error('test');

    expect(toError(error)).toBe(error);
  });

  it('should preserve Error subclass', () => {
    const error = new TypeError('type error');

    expect(toError(error)).toBe(error);
  });

  it('should wrap a string with JSON representation and preserve cause', () => {
    const result = toError('something went wrong');

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe('Unknown error: "something went wrong"');
    expect(result.cause).toBe('something went wrong');
  });

  it('should wrap a number and preserve cause', () => {
    const result = toError(42);

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe('Unknown error: 42');
    expect(result.cause).toBe(42);
  });

  it('should wrap an object and preserve cause', () => {
    const obj = { code: 'FAIL' };
    const result = toError(obj);

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe('Unknown error: {"code":"FAIL"}');
    expect(result.cause).toBe(obj);
  });

  it('should wrap null and preserve cause', () => {
    const result = toError(null);

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe('Unknown error: null');
    expect(result.cause).toBeNull();
  });

  it('should handle circular references and preserve cause', () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;

    const result = toError(circular);

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe('Unknown error (object): not serializable');
    expect(result.cause).toBe(circular);
  });
});
