import { ExceptionKind, ExceptionNameField } from '../const';
import { ExceptionProps } from './exception-props.type';
import { BaseException } from '../abstract';
import { OptionalClassConstructor } from '@boostpack/class';

export type ExceptionClass<
  DataType extends OptionalClassConstructor,
  ExceptionName extends string | undefined = string | undefined,
> = (new (props: Omit<ExceptionProps<DataType>, 'type'>) => BaseException<DataType, ExceptionName>) & {
  kind: ExceptionKind;
  dataType: DataType;
  problemType: string;
  title?: string;
  jsonRpcCode?: number;
  [ExceptionNameField]: ExceptionName;
};
