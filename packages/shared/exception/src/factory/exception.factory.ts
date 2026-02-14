/* eslint-disable @typescript-eslint/naming-convention */
import { BaseException } from '../abstract';
import { ExceptionKind, ExceptionNameField } from '../const';
import { ExceptionClass, ExceptionProps } from '../type';
import { OptionalClassConstructor } from '@boostpack/class';

type Params<
  DataType extends OptionalClassConstructor = undefined,
  ExceptionName extends string | undefined = undefined,
> = {
  kind?: ExceptionKind;
  dataType?: DataType;
  problemType?: string;
  title?: string;
  name?: ExceptionName;
};

export function Exception<
  DataType extends OptionalClassConstructor = undefined,
  ExceptionName extends string | undefined = undefined,
>(options: Params<DataType, ExceptionName>): ExceptionClass<DataType, ExceptionName> {
  const {
    kind = ExceptionKind.Internal,
    dataType,
    problemType = 'internal_error',
    title,
    name: exceptionName,
  } = options;

  const ExceptionClass = class extends BaseException<DataType, ExceptionName> {
    static readonly [ExceptionNameField] = exceptionName as ExceptionName;
    override readonly [ExceptionNameField] = exceptionName as ExceptionName;

    static readonly kind: ExceptionKind = kind;
    static readonly dataType = dataType;
    static readonly problemType = problemType;
    static readonly title = title;

    constructor(props: Omit<ExceptionProps<DataType>, 'type'>) {
      const finalTitle = props.title || title;
      super(kind, { ...props, type: problemType, title: finalTitle } as ExceptionProps<DataType>);
    }
  };

  return ExceptionClass as ExceptionClass<DataType, ExceptionName>;
}
