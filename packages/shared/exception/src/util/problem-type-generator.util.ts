/**
 * Generates a problem type from a class name by converting CamelCase to snake_case
 * and removing the "Exception" suffix.
 *
 * @example
 * generateProblemType('UserNotFoundException') // returns 'user_not_found'
 * generateProblemType('ExchangeAmountValidationException') // returns 'exchange_amount_validation'
 */
export function generateProblemType(className: string): string {
  return className
    .replace(/Exception$/, '')
    .replace(/([A-Z])/g, '_$1')
    .replace(/^_/, '')
    .toLowerCase();
}
