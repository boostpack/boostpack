import { ExceptionNameField } from '../const';

type ExceptionName<T extends { [ExceptionNameField]: string }> = T[typeof ExceptionNameField];

type Handler<T extends { [ExceptionNameField]: string }, ResultType> = (exception: T) => ResultType;

type ExceptionRecord<T extends { [ExceptionNameField]: string }, ResultType> = T extends unknown
  ? { [K in ExceptionName<T>]: Handler<T, ResultType> }
  : never;

type UnionToIntersection<U> = (U extends unknown ? (x: U) => void : never) extends (x: infer I) => void ? I : never;

type NamedExceptionObject<T extends { [ExceptionNameField]: string }, ResultType> = UnionToIntersection<
  ExceptionRecord<T, ResultType>
>;

export function mapByException<ExceptionType extends { [ExceptionNameField]: string }, ResultType>(
  exception: ExceptionType,
  mapping: NamedExceptionObject<ExceptionType, ResultType>,
): ResultType {
  const exceptionName = exception[ExceptionNameField] as keyof typeof mapping;
  const handler = mapping[exceptionName] as Handler<ExceptionType, ResultType>;

  return handler(exception);
}
