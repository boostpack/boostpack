import { ExceptionKind } from './const';
import { Exception } from './factory';
import { toError } from '@boostpack/error';

// NOTE: Here defined only common exceptions

export class InternalException extends Exception({
  name: 'InternalException',
  kind: ExceptionKind.Internal,
  problemType: 'internal_error',
  title: 'Internal Error',
}) {
  constructor(options?: { title?: string; detail?: string; instance?: string; cause?: unknown }) {
    super({
      title: options?.title,
      detail: options?.detail ?? 'An unexpected error occurred',
      instance: options?.instance,
      cause: toError(options?.cause),
    });
  }
}

export class NotImplementedException extends Exception({
  name: 'NotImplementedException',
  kind: ExceptionKind.Internal,
  problemType: 'not_implemented',
  title: 'Not Implemented',
}) {
  constructor(options?: { title?: string; detail?: string; instance?: string }) {
    super({
      title: options?.title,
      detail: options?.detail ?? 'Feature not implemented',
      instance: options?.instance,
    });
  }
}

export class ForbiddenException extends Exception({
  name: 'ForbiddenException',
  kind: ExceptionKind.Forbidden,
  problemType: 'forbidden_error',
  title: 'Forbidden Error',
}) {
  constructor(options?: { title?: string; detail?: string; instance?: string }) {
    super({
      title: options?.title,
      detail: options?.detail ?? 'Access denied',
      instance: options?.instance,
    });
  }
}
