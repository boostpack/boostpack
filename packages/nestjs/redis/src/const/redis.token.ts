/**
 * Name of the default Redis connection, used when no explicit connection name
 * is provided. Allows the single-connection case to stay terse while still
 * supporting multiple named connections.
 */
export const RedisDefaultConnection = 'default';

/**
 * DI token for a singleton Redis client of the given connection.
 */
export const getRedisConnectionToken = (name: string = RedisDefaultConnection): string =>
  `BoostpackRedisConnection:${name}`;

/**
 * DI token for a transient (per-consumer) Redis client of the given connection.
 */
export const getRedisTransientConnectionToken = (name: string = RedisDefaultConnection): string =>
  `BoostpackRedisTransientConnection:${name}`;

/**
 * DI token for the resolved {@link RedisConfig} of the given connection.
 */
export const getRedisConfigToken = (name: string = RedisDefaultConnection): string => `BoostpackRedisConfig:${name}`;

/**
 * DI token for the {@link RedisHealthIndicator} bound to the given connection.
 */
export const getRedisHealthIndicatorToken = (name: string = RedisDefaultConnection): string =>
  `BoostpackRedisHealthIndicator:${name}`;
