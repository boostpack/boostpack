import { generateProblemType } from './problem-type-generator.util';

describe('generateProblemType', () => {
  it('should convert class name to snake_case problem type', () => {
    expect(generateProblemType('UserNotFoundException')).toBe('user_not_found');
  });

  it('should handle multiple words', () => {
    expect(generateProblemType('ExchangeAmountValidationException')).toBe('exchange_amount_validation');
  });

  it('should handle single word', () => {
    expect(generateProblemType('InternalException')).toBe('internal');
  });

  it('should handle class name without Exception suffix', () => {
    expect(generateProblemType('NotFound')).toBe('not_found');
  });
});
