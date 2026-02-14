import { ExceptionNameField } from '../const';

export function getExceptionName<T extends { [ExceptionNameField]: string }>(
  exception: T,
): T[typeof ExceptionNameField] {
  return exception[ExceptionNameField];
}
