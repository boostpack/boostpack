import { ExceptionKind } from '../const';
import { ExceptionHttpStatusMapper } from './exception-http-status.mapper';

describe('ExceptionHttpStatusMapper', () => {
  describe('getHttpStatus', () => {
    it.each([
      [ExceptionKind.ClientDataValidation, 400],
      [ExceptionKind.Validation, 400],
      [ExceptionKind.Unauthorized, 401],
      [ExceptionKind.Forbidden, 403],
      [ExceptionKind.NotFound, 404],
      [ExceptionKind.Conflict, 409],
      [ExceptionKind.RateLimit, 429],
      [ExceptionKind.Internal, 500],
    ])('should map %s to %i', (kind, status) => {
      expect(ExceptionHttpStatusMapper.getHttpStatus(kind)).toBe(status);
    });
  });

  describe('getKind', () => {
    it.each([
      [401, ExceptionKind.Unauthorized],
      [403, ExceptionKind.Forbidden],
      [404, ExceptionKind.NotFound],
      [409, ExceptionKind.Conflict],
      [429, ExceptionKind.RateLimit],
      [500, ExceptionKind.Internal],
    ])('should map %i to %s', (status, kind) => {
      expect(ExceptionHttpStatusMapper.getKind(status)).toBe(kind);
    });

    it('should fallback to Internal for unknown status', () => {
      expect(ExceptionHttpStatusMapper.getKind(418)).toBe(ExceptionKind.Internal);
    });
  });
});
