import { DynamicModule, Module, OnApplicationShutdown, Scope } from '@nestjs/common';
import { createRedisClient, redisConfigFromEnv } from './config';
import {
  RedisDefaultConnection,
  getRedisConfigToken,
  getRedisConnectionToken,
  getRedisHealthIndicatorToken,
  getRedisTransientConnectionToken,
} from './const';
import { RedisHealthIndicator } from './redis.health';
import type { Provider } from '@nestjs/common';
import type { RedisClientContext } from './config';
import type {
  RedisAnyClient,
  RedisConfig,
  RedisConnectionBehavior,
  RedisModuleAsyncOptions,
  RedisModuleOptions,
} from './type';

/**
 * Closes a singleton Redis connection on application shutdown. Registered only
 * when `closeOnShutdown` is enabled; requires `app.enableShutdownHooks()`.
 */
class RedisConnectionCloser implements OnApplicationShutdown {
  constructor(private readonly client: RedisAnyClient) {}

  async onApplicationShutdown(): Promise<void> {
    await this.client.close();
  }
}

@Module({})
export class RedisModule {
  /**
   * Registers a Redis connection. Provide `config` for an explicit, type-safe
   * connection, or omit it to read `REDIS_*` (or `REDIS_<NAME>_*` for a named
   * connection) from the environment.
   */
  static forRoot(options: RedisModuleOptions = {}): DynamicModule {
    const { name = RedisDefaultConnection, isGlobal = true, config, ...behavior } = options;

    const configProvider: Provider = config
      ? { provide: getRedisConfigToken(name), useValue: config }
      : { provide: getRedisConfigToken(name), useFactory: () => redisConfigFromEnv({ name }) };

    return RedisModule.build(name, configProvider, isGlobal, behavior);
  }

  /**
   * Registers a Redis connection whose config is produced by an (optionally
   * async) factory with injected dependencies.
   */
  static forRootAsync(options: RedisModuleAsyncOptions): DynamicModule {
    const {
      imports = [],
      inject = [],
      useFactory,
      name = RedisDefaultConnection,
      isGlobal = true,
      ...behavior
    } = options;

    const configProvider: Provider = {
      provide: getRedisConfigToken(name),
      useFactory,
      inject,
    };

    return RedisModule.build(name, configProvider, isGlobal, behavior, imports);
  }

  private static build(
    name: string,
    configProvider: Provider,
    isGlobal: boolean,
    behavior: RedisConnectionBehavior,
    imports: NonNullable<DynamicModule['imports']> = [],
  ): DynamicModule {
    const configToken = getRedisConfigToken(name);
    const connectionToken = getRedisConnectionToken(name);
    const transientToken = getRedisTransientConnectionToken(name);
    const healthToken = getRedisHealthIndicatorToken(name);

    const clientContext: RedisClientContext = {
      name,
      lazyConnect: behavior.lazyConnect,
      onError: behavior.onError,
      onReady: behavior.onReady,
    };

    const providers: Provider[] = [
      configProvider,
      {
        provide: connectionToken,
        useFactory: (config: RedisConfig) => createRedisClient(config, clientContext),
        inject: [configToken],
      },
      {
        provide: transientToken,
        scope: Scope.TRANSIENT,
        useFactory: (config: RedisConfig) => createRedisClient(config, clientContext),
        inject: [configToken],
      },
      {
        provide: healthToken,
        useFactory: (redis: RedisAnyClient) => new RedisHealthIndicator(redis),
        inject: [connectionToken],
      },
    ];

    if (behavior.closeOnShutdown ?? true) {
      providers.push({
        provide: `BoostpackRedisConnectionCloser:${name}`,
        useFactory: (client: RedisAnyClient) => new RedisConnectionCloser(client),
        inject: [connectionToken],
      });
    }

    return {
      module: RedisModule,
      global: isGlobal,
      imports,
      providers,
      exports: [configToken, connectionToken, transientToken, healthToken],
    };
  }
}
