export enum ExceptionKind {
  // Used only for input data validation
  ClientDataValidation = 'client_data_validation',

  // Business logic kinds
  Validation = 'validation',
  Unauthorized = 'unauthorized',
  Forbidden = 'forbidden',
  NotFound = 'not_found',
  Conflict = 'conflict',

  RateLimit = 'rate_limit',

  // All other kinds
  Internal = 'internal',
}
