import type { FactoryProvider, ModuleMetadata } from '@nestjs/common';
import type { RedisConfig } from './redis-config.type';

/**
 * Behavior shared by `forRoot` / `forRootAsync` controlling how a connection is
 * established, observed and torn down.
 */
export type RedisConnectionBehavior = {
  /**
   * Connect in the background instead of blocking application bootstrap.
   *
   * With the default (`false`), the connection is awaited during startup — and
   * because node-redis retries with the default reconnect strategy indefinitely,
   * an unreachable Redis will block bootstrap. Set `true` for resilient startup:
   * the app boots immediately, the connection is established in the background
   * (commands issued meanwhile are queued), and a readiness probe should gate
   * traffic. Defaults to `false`.
   */
  lazyConnect?: boolean;
  /**
   * Close the singleton connection on application shutdown (requires
   * `app.enableShutdownHooks()`). Enabled by default — the module owns the
   * connection it opened and closes it in the last shutdown phase
   * (`onApplicationShutdown`) with a graceful `close()`. Set `false` if your app
   * manages the connection lifecycle itself. Defaults to `true`.
   */
  closeOnShutdown?: boolean;
  /**
   * Called on every client `error` event, in addition to the built-in logging.
   * Use it to forward errors to your own monitoring.
   */
  onError?: (error: Error) => void;
  /**
   * Called whenever the client becomes ready (initial connect and after a
   * successful reconnect).
   */
  onReady?: () => void;
};

/**
 * Options for {@link RedisModule.forRoot}.
 *
 * `name` and `isGlobal` configure the connection at the module level; the
 * connection itself is described by the nested `config`. When `config` is
 * omitted, it is read from the environment via {@link redisConfigFromEnv} using
 * the connection `name` to derive the env var names.
 */
export type RedisModuleOptions = RedisConnectionBehavior & {
  /**
   * Connection name. Use distinct names to register multiple independent Redis
   * connections (e.g. `cache`, `sessions`). Defaults to `default`.
   */
  name?: string;
  /**
   * Register the connection as a global module. Defaults to `true`.
   */
  isGlobal?: boolean;
  /**
   * Explicit, type-safe connection config. Omit to read it from the environment.
   */
  config?: RedisConfig;
};

/**
 * Options for {@link RedisModule.forRootAsync}. The factory produces the
 * connection config; `name` / `isGlobal` stay at the module level.
 */
export type RedisModuleAsyncOptions = Pick<ModuleMetadata, 'imports'> &
  Pick<FactoryProvider<RedisConfig | Promise<RedisConfig>>, 'inject' | 'useFactory'> &
  RedisConnectionBehavior & {
    /**
     * Connection name. Use distinct names to register multiple independent
     * Redis connections (e.g. `cache`, `sessions`). Defaults to `default`.
     */
    name?: string;
    /**
     * Register the connection as a global module. Defaults to `true`.
     */
    isGlobal?: boolean;
  };

/**
 * Options for {@link redisConfigFromEnv}.
 */
export type RedisConfigFromEnvOptions = {
  /**
   * Connection name driving the env var names: `default` reads `REDIS_*`, any
   * other name reads `REDIS_<NAME>_*` (e.g. `cache` -> `REDIS_CACHE_HOSTS`).
   */
  name?: string;
  /**
   * Source object to read env vars from. Defaults to `process.env`.
   */
  env?: Record<string, unknown>;
};
