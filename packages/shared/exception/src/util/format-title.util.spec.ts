import { formatTitleFromClassName } from './format-title.util';

describe('formatTitleFromClassName', () => {
  it('should convert class name to title', () => {
    expect(formatTitleFromClassName('UserNotFoundException')).toBe('User not found');
  });

  it('should handle multiple words', () => {
    expect(formatTitleFromClassName('ExchangeAmountValidationException')).toBe('Exchange amount validation');
  });

  it('should handle single word', () => {
    expect(formatTitleFromClassName('InternalException')).toBe('Internal');
  });

  it('should handle class name without Exception suffix', () => {
    expect(formatTitleFromClassName('NotFound')).toBe('Not found');
  });
});
