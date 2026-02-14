import { Exception } from '../factory';
import { ExceptionKind } from '../const';
import { mapByException } from './map-by-exception.util';
import { getExceptionName } from './exception-name.util';

describe('mapByException', () => {
  it('should return correct value', () => {
    class TestExceptionA extends Exception({
      kind: ExceptionKind.Internal,
      problemType: 'internal_error',
      name: 'TestExceptionA',
    }) {
      constructor() {
        super({ title: 'Title A' });
      }
    }

    class TestExceptionB extends Exception({
      kind: ExceptionKind.Conflict,
      problemType: 'internal_error',
      name: 'TestExceptionB',
    }) {
      constructor() {
        super({ title: 'Title B' });
      }
    }

    class TestExceptionC extends Exception({
      kind: ExceptionKind.Conflict,
      problemType: 'internal_error',
      name: 'TestExceptionC',
    }) {
      constructor() {
        super({ title: 'Title C' });
      }
    }

    function getException(): TestExceptionA | TestExceptionB | TestExceptionC {
      return new TestExceptionB();
    }

    const exception = getException();

    const result = mapByException<typeof exception, { exception: typeof exception; title?: string }>(exception, {
      [getExceptionName(TestExceptionA)]: (e) => ({ exception: e, title: e.title }),
      [getExceptionName(TestExceptionB)]: (e) => ({ exception: e, title: e.title }),
      [getExceptionName(TestExceptionC)]: (e) => ({ exception: e, title: e.title }),
    });

    expect(result.exception).toBe(exception);
    expect(result.title).toBe('Title B');
  });
});
