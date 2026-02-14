import { Exception } from './exception.factory';
import { ExceptionKind, ExceptionNameField } from '../const';
import { BaseException } from '../abstract';
import { expectTypeOf } from 'expect-type';

describe('Exception factory', () => {
  describe('static properties', () => {
    it('should use provided values', () => {
      const TestException = Exception({
        kind: ExceptionKind.NotFound,
        problemType: 'user_not_found',
        title: 'User Not Found',
        name: 'UserNotFoundException',
      });

      expect(TestException.kind).toBe(ExceptionKind.NotFound);
      expect(TestException.problemType).toBe('user_not_found');
      expect(TestException.title).toBe('User Not Found');
      expect(TestException[ExceptionNameField]).toBe('UserNotFoundException');
    });

    it('should use default values', () => {
      const TestException = Exception({});

      expect(TestException.kind).toBe(ExceptionKind.Internal);
      expect(TestException.problemType).toBe('internal_error');
      expect(TestException.title).toBeUndefined();
      expect(TestException.dataType).toBeUndefined();
      expect(TestException[ExceptionNameField]).toBeUndefined();
    });

    it('should set dataType', () => {
      class UserData {
        id!: string;
      }

      const TestException = Exception({ dataType: UserData });

      expect(TestException.dataType).toBe(UserData);
    });
  });

  describe('instance properties', () => {
    it('should be instance of Error and BaseException', () => {
      class TestException extends Exception({}) {
        constructor() {
          super({ detail: 'test' });
        }
      }

      const exception = new TestException();

      expect(exception).toBeInstanceOf(Error);
      expect(exception).toBeInstanceOf(BaseException);
      expect(exception).toBeInstanceOf(TestException);
    });

    it('should set kind and type from factory options', () => {
      class TestException extends Exception({
        kind: ExceptionKind.Conflict,
        problemType: 'duplicate_entry',
      }) {
        constructor() {
          super({ detail: 'Already exists' });
        }
      }

      const exception = new TestException();

      expect(exception.kind).toBe(ExceptionKind.Conflict);
      expect(exception.type).toBe('duplicate_entry');
    });

    it('should use detail as message', () => {
      class TestException extends Exception({}) {
        constructor() {
          super({ detail: 'Something went wrong' });
        }
      }

      const exception = new TestException();

      expect(exception.message).toBe('Something went wrong');
      expect(exception.detail).toBe('Something went wrong');
    });

    it('should fall back to title when detail is not provided', () => {
      class TestException extends Exception({ title: 'Factory Title' }) {
        constructor() {
          super({});
        }
      }

      const exception = new TestException();

      expect(exception.message).toBe('Factory Title');
      expect(exception.title).toBe('Factory Title');
    });

    it('should allow overriding title from constructor', () => {
      class TestException extends Exception({ title: 'Factory Title' }) {
        constructor() {
          super({ title: 'Override Title' });
        }
      }

      const exception = new TestException();

      expect(exception.title).toBe('Override Title');
    });

    it('should set exception name on instance', () => {
      class TestException extends Exception({ name: 'TestException' }) {
        constructor() {
          super({ detail: 'test' });
        }
      }

      const exception = new TestException();

      expect(exception[ExceptionNameField]).toBe('TestException');
    });

    it('should set cause', () => {
      const cause = new Error('root cause');

      class TestException extends Exception({}) {
        constructor() {
          super({ detail: 'wrapped', cause });
        }
      }

      const exception = new TestException();

      expect(exception.cause).toBe(cause);
    });

    it('should set meta', () => {
      class TestException extends Exception({}) {
        constructor() {
          super({ detail: 'test', meta: { requestId: '123' } });
        }
      }

      const exception = new TestException();

      expect(exception.meta).toEqual({ requestId: '123' });
    });

    it('should set RFC 9457 instance field', () => {
      class TestException extends Exception({}) {
        constructor() {
          super({ detail: 'test', instance: '/api/problems/instances/abc' });
        }
      }

      const exception = new TestException();

      expect(exception.instance).toBe('/api/problems/instances/abc');
    });

    it('should set data when dataType is provided', () => {
      class UserData {
        constructor(public id: string) {}
      }

      class TestException extends Exception({ dataType: UserData }) {
        constructor(data: UserData) {
          super({ detail: 'test', data });
        }
      }

      const data = new UserData('123');
      const exception = new TestException(data);

      expect(exception.data).toBe(data);
      expect(exception.data.id).toBe('123');
    });
  });

  describe('type safety', () => {
    it('should type exception name as literal', () => {
      class TestException extends Exception({ name: 'TestException' }) {
        constructor() {
          super({ detail: 'test' });
        }
      }

      const exception = new TestException();

      expectTypeOf(exception[ExceptionNameField]).toEqualTypeOf<'TestException'>();
      expectTypeOf(TestException[ExceptionNameField]).toEqualTypeOf<'TestException'>();
    });

    it('should type exception name as undefined when not provided', () => {
      const TestException = Exception({});

      expectTypeOf(TestException[ExceptionNameField]).toEqualTypeOf<undefined>();
    });

    it('should type data as InstanceType when dataType is provided', () => {
      class UserData {
        id!: string;
      }

      class TestException extends Exception({ dataType: UserData }) {
        constructor(data: UserData) {
          super({ detail: 'test', data });
        }
      }

      const exception = new TestException(new UserData());

      expectTypeOf(exception.data).toEqualTypeOf<UserData>();
    });

    it('should type data as undefined when dataType is not provided', () => {
      class TestException extends Exception({}) {
        constructor() {
          super({ detail: 'test' });
        }
      }

      const exception = new TestException();

      expectTypeOf(exception.data).toEqualTypeOf<undefined>();
    });

    it('should require data in props when dataType is provided', () => {
      class UserData {
        id!: string;
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      class TestException extends Exception({ dataType: UserData }) {}

      type Props = ConstructorParameters<typeof TestException>[0];

      expectTypeOf<Props>().toHaveProperty('data');
      expectTypeOf<Props['data']>().toEqualTypeOf<UserData>();
    });

    it('should not have data in props when dataType is not provided', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      class TestException extends Exception({}) {}

      type Props = ConstructorParameters<typeof TestException>[0];

      expectTypeOf<Props>().not.toHaveProperty('data');
    });

    it('should distinguish different named exceptions by type', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      class ExceptionA extends Exception({ name: 'ExceptionA' }) {
        constructor() {
          super({ detail: 'A' });
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      class ExceptionB extends Exception({ name: 'ExceptionB' }) {
        constructor() {
          super({ detail: 'B' });
        }
      }

      type NameA = InstanceType<typeof ExceptionA>[typeof ExceptionNameField];
      type NameB = InstanceType<typeof ExceptionB>[typeof ExceptionNameField];

      expectTypeOf<NameA>().toEqualTypeOf<'ExceptionA'>();
      expectTypeOf<NameB>().toEqualTypeOf<'ExceptionB'>();
      expectTypeOf<NameA>().not.toEqualTypeOf<NameB>();
    });
  });

  describe('toJSON', () => {
    it('should serialize all fields', () => {
      class TestException extends Exception({
        kind: ExceptionKind.NotFound,
        problemType: 'not_found',
        name: 'TestException',
      }) {
        constructor() {
          super({
            title: 'Not Found',
            detail: 'Resource not found',
            instance: '/api/problems/instances/abc',
            meta: { resourceId: '123' },
          });
        }
      }

      const json = new TestException().toJSON();

      expect(json).toEqual({
        message: 'Resource not found',
        kind: ExceptionKind.NotFound,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        stack: expect.any(String),
        cause: undefined,
        data: undefined,
        meta: { resourceId: '123' },
        type: 'not_found',
        title: 'Not Found',
        detail: 'Resource not found',
        instance: '/api/problems/instances/abc',
      });
    });

    it('should serialize plain Error cause with message and stack', () => {
      const cause = new Error('root cause');

      class TestException extends Exception({}) {
        constructor() {
          super({ detail: 'wrapped', cause });
        }
      }

      const json = new TestException().toJSON();

      expect(json.cause).toEqual({
        message: 'root cause',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        stack: expect.any(String),
      });
    });

    it('should serialize exception cause with all fields', () => {
      class CauseException extends Exception({
        kind: ExceptionKind.NotFound,
        problemType: 'not_found',
      }) {
        constructor() {
          super({ detail: 'Not found', meta: { id: '42' } });
        }
      }

      class TestException extends Exception({}) {
        constructor() {
          super({ detail: 'wrapped', cause: new CauseException() });
        }
      }

      const json = new TestException().toJSON();
      const cause = json.cause as Record<string, unknown>;

      expect(cause.message).toBe('Not found');
      expect(cause.kind).toBe(ExceptionKind.NotFound);
      expect(cause.type).toBe('not_found');
      expect(cause.detail).toBe('Not found');
      expect(cause.meta).toEqual({ id: '42' });
      expect(cause.stack).toBeDefined();
    });

    it('should serialize cause as undefined when not provided', () => {
      class TestException extends Exception({}) {
        constructor() {
          super({ detail: 'test' });
        }
      }

      expect(new TestException().toJSON().cause).toBeUndefined();
    });
  });
});
