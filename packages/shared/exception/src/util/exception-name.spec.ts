import { ExceptionKind, ExceptionNameField } from '../const';
import { Exception } from '../factory';
import { getExceptionName } from './exception-name.util';

describe('Exception name', () => {
  class TestExceptionA extends Exception({
    kind: ExceptionKind.Internal,
    problemType: 'internal_error',
    name: 'TestExceptionA',
  }) {
    constructor() {
      super({ title: 'Title A' });
    }
  }

  it('getExceptionName() should return exception name', () => {
    const exceptionName: 'TestExceptionA' = getExceptionName(TestExceptionA);

    expect(exceptionName).toBe('TestExceptionA');
  });

  it('exception name should be defined', () => {
    const exception = new TestExceptionA();
    const exceptionName: 'TestExceptionA' = exception[ExceptionNameField];

    expect(exceptionName).toBe('TestExceptionA');
  });
});
