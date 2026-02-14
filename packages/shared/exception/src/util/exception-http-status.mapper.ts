import { ExceptionKind } from '../const';

const exceptionKindToHttpStatus: Record<ExceptionKind, number> = {
  [ExceptionKind.ClientDataValidation]: 400,
  [ExceptionKind.Validation]: 400,
  [ExceptionKind.Unauthorized]: 401,
  [ExceptionKind.Forbidden]: 403,
  [ExceptionKind.NotFound]: 404,
  [ExceptionKind.Conflict]: 409,
  [ExceptionKind.RateLimit]: 429,
  [ExceptionKind.Internal]: 500,
};

const httpStatusToExceptionKind = Object.entries(exceptionKindToHttpStatus).reduce(
  (acm, [kind, status]) => {
    acm[status] = kind as ExceptionKind;

    return acm;
  },
  {} as Record<number, ExceptionKind>,
);

export class ExceptionHttpStatusMapper {
  static getHttpStatus(kind: ExceptionKind): number {
    return exceptionKindToHttpStatus[kind];
  }

  static getKind(status: number): ExceptionKind {
    return httpStatusToExceptionKind[status] ?? ExceptionKind.Internal;
  }
}
