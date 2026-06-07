import { Logger } from '@nestjs/common';
import type { RedisAnyClient } from './type';

/**
 * Result of a Redis health check. Structurally compatible with
 * `@nestjs/terminus`'s `HealthIndicatorResult`, so it can be returned directly
 * from a `HealthCheckService.check(...)` indicator function — without this
 * package depending on terminus.
 */
export type RedisHealthCheckResult = Record<string, { status: 'up' | 'down' } & Record<string, unknown>>;

const defaultPingTimeoutMs = 1000;

const toResult = (key: string, status: 'up' | 'down', message?: string): RedisHealthCheckResult => ({
  [key]: message === undefined ? { status } : { status, message },
});

/**
 * Derives a diagnostic-but-safe reason for the health response: prefers the
 * error code (e.g. `ECONNREFUSED`, `ETIMEDOUT`) — which says what failed without
 * the host/IP/port that node-redis embeds in the raw message — and otherwise
 * falls back to the (controlled) message with any IPv4 address redacted.
 */
const describeFailure = (error: unknown): string => {
  if (!(error instanceof Error)) {
    return 'unknown error';
  }

  const { code } = error as NodeJS.ErrnoException;

  if (typeof code === 'string' && code.length > 0) {
    return code;
  }

  return error.message.replace(/\b\d{1,3}(?:\.\d{1,3}){3}\b(?::\d+)?/g, '<redacted>');
};

const withTimeout = async <T>(promise: Promise<T>, ms: number): Promise<T> => {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => reject(new Error(`Redis ping timed out after ${ms}ms`)), ms);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer !== undefined) {
      clearTimeout(timer);
    }
  }
};

/**
 * Pings a single Redis connection and reports a terminus-compatible result.
 *
 * The check is non-blocking: if the connection is not ready it reports `down`
 * immediately instead of queuing a ping that would hang until reconnect, and the
 * ping itself is bounded by a timeout. The `down` reason is kept diagnostic but
 * free of host/IP/port (the full error is logged server-side) so a health
 * endpoint never leaks internal infrastructure. Instances are created per
 * connection by {@link RedisModule}; inject one with `@InjectRedisHealth(name?)`.
 */
export class RedisHealthIndicator {
  private readonly logger = new Logger(RedisHealthIndicator.name);

  constructor(private readonly redis: RedisAnyClient) {}

  async pingCheck(key = 'redis', options?: { timeout?: number }): Promise<RedisHealthCheckResult> {
    if (!this.isConnected()) {
      return toResult(key, 'down', 'connection is not ready');
    }

    const timeout = options?.timeout ?? defaultPingTimeoutMs;

    try {
      const result = await withTimeout(this.redis.ping(), timeout);
      if (result === 'PONG') {
        return toResult(key, 'up');
      }

      this.logger.warn(`"${key}" health check: unexpected ping reply: ${String(result)}`);

      return toResult(key, 'down', 'unexpected ping reply');
    } catch (error) {
      this.logger.warn(
        `"${key}" health check failed: ${error instanceof Error ? (error.stack ?? error.message) : String(error)}`,
      );

      return toResult(key, 'down', describeFailure(error));
    }
  }

  private isConnected(): boolean {
    if ('isReady' in this.redis) {
      return this.redis.isReady;
    }

    return this.redis.isOpen;
  }
}
