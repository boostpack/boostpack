export function toError(value: unknown): Error {
  if (value instanceof Error) {
    return value;
  }

  try {
    return new Error(`Unknown error: ${JSON.stringify(value)}`, { cause: value });
  } catch {
    return new Error(`Unknown error (${typeof value}): not serializable`, {
      cause: value,
    });
  }
}
