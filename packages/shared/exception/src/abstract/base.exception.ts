import { ClassConstructor, OptionalClassConstructor } from '@boostpack/class';
import { ExceptionKind, ExceptionNameField } from '../const';
import { ExceptionProps } from '../type';

export abstract class BaseException<
  DataType extends OptionalClassConstructor,
  ExceptionName extends string | undefined,
> extends Error {
  readonly [ExceptionNameField]!: ExceptionName;

  kind: ExceptionKind;

  override message: string;

  // Underlying error that caused this exception.
  override cause?: Error;

  // Exposed to user data if it doesn't catch by application.
  data!: DataType extends ClassConstructor ? InstanceType<DataType> : undefined;

  meta?: Record<string, unknown>;

  // RFC 9457 Problem Details fields
  type: string;
  title?: string;
  detail?: string;
  instance?: string;

  protected constructor(kind: ExceptionKind, props: ExceptionProps<DataType>) {
    super(props.detail ?? props.title ?? 'An error occurred');

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }

    this.kind = kind;

    this.message = props.detail ?? props.title ?? 'An error occurred';
    this.cause = props.cause;

    if ('data' in props) {
      this.data = (props as { data: unknown }).data as typeof this.data;
    }

    this.meta = props.meta;

    // RFC 9457 Problem Details fields
    // Use the provided type or fall back to the class's static problemType
    const exceptionClass = this.constructor as typeof BaseException & { problemType?: string };
    this.type = props.type ?? exceptionClass.problemType ?? 'internal_error';

    if ('title' in props) {
      this.title = props.title;
    }

    if ('detail' in props) {
      this.detail = props.detail;
    }

    if ('instance' in props) {
      this.instance = props.instance;
    }
  }

  /**
   * By default, in Node.js Error objects are not
   * serialized properly when sending plain objects
   * to external processes. This method is a workaround.
   */
  toJSON() {
    return {
      message: this.message,
      kind: this.kind,
      stack: this.stack,
      cause: this.cause ? { ...this.cause, message: this.cause.message, stack: this.cause.stack } : undefined,
      data: this.data,
      meta: this.meta,
      // RFC 9457 fields
      type: this.type,
      title: this.title,
      detail: this.detail,
      instance: this.instance,
    };
  }
}

export type AnyException = BaseException<OptionalClassConstructor, string | undefined>;
