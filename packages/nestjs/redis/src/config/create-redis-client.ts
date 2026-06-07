import { Logger } from '@nestjs/common';
import { createClient, createCluster, createSentinel } from 'redis';
import { RedisMode } from '../const';
import type { EventEmitter } from 'node:events';
import type { RedisConfig } from '../type';

/**
 * Context for {@link createRedisClient}: connection name plus lifecycle behavior.
 */
export type RedisClientContext = {
  name: string;
  lazyConnect?: boolean;
  onError?: (error: Error) => void;
  onReady?: () => void;
};

const buildClient = (config: RedisConfig) => {
  if (config.mode === RedisMode.Cluster) {
    return createCluster({
      ...config.options,
      rootNodes: config.hosts.map(({ host, port }) => ({ socket: { host, port } })),
      defaults: {
        ...config.options?.defaults,
        ...(config.password === undefined ? {} : { password: config.password }),
      },
    });
  }

  if (config.mode === RedisMode.Sentinel) {
    return createSentinel({
      ...config.options,
      name: config.sentinelGroupIdentifier,
      sentinelRootNodes: config.hosts.map(({ host, port }) => ({ host, port })),
      nodeClientOptions: {
        ...config.options?.nodeClientOptions,
        ...(config.password === undefined ? {} : { password: config.password }),
        ...(config.database === undefined ? {} : { database: config.database }),
      },
    });
  }

  const [primary] = config.hosts;

  return createClient({
    ...config.options,
    socket: { ...config.options?.socket, host: primary.host, port: primary.port },
    ...(config.password === undefined ? {} : { password: config.password }),
    ...(config.database === undefined ? {} : { database: config.database }),
  });
};

/**
 * Creates a node-redis client (standalone, sentinel or cluster) for the given
 * resolved config, attaches lifecycle handlers and connects it.
 *
 * An `error` handler is always attached so a connection drop never crashes the
 * process (node-redis clients are `EventEmitter`s). With `lazyConnect`, the
 * connection is established in the background and the client is returned
 * immediately; otherwise the connection is awaited.
 *
 * `config.options` are passed through to the underlying node-redis factory, with
 * the structured config fields taking precedence over the keys this module
 * manages.
 */
export const createRedisClient = async (config: RedisConfig, context: RedisClientContext) => {
  const client = buildClient(config);
  const logger = new Logger('RedisModule');

  const emitter = client as unknown as EventEmitter;

  emitter.on('error', (error: Error) => {
    logger.error(`Connection "${context.name}" error: ${error.message}`, error.stack);
    context.onError?.(error);
  });

  emitter.on('ready', () => {
    logger.log(`Connection "${context.name}" ready`);
    context.onReady?.();
  });

  emitter.on('reconnecting', () => logger.warn(`Connection "${context.name}" reconnecting`));
  emitter.on('end', () => logger.log(`Connection "${context.name}" closed`));

  if (context.lazyConnect) {
    // Connect in the background; node-redis keeps retrying per its reconnect
    // strategy, so the app boots immediately and commands queue until ready.
    void client.connect().catch((error: unknown) => {
      const reason = error instanceof Error ? error : new Error(String(error));
      logger.error(`Connection "${context.name}" failed to connect: ${reason.message}`, reason.stack);
    });
  } else {
    await client.connect();
  }

  return client;
};
