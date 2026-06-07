import { createConfig } from '@boostpack/nestjs-config';
import Joi from 'joi';
import { RedisDefaultConnection, RedisMode } from '../const';
import type {
  RedisClusterConfig,
  RedisConfig,
  RedisConfigFromEnvOptions,
  RedisHost,
  RedisSentinelConfig,
  RedisStandaloneConfig,
} from '../type';

/**
 * Builds the env var name segment for a connection. The default connection adds
 * nothing (`REDIS_MODE`); any other name is inserted as an uppercased infix
 * (`cache` -> `REDIS_CACHE_MODE`).
 */
const segmentForName = (name: string): string =>
  name === RedisDefaultConnection ? '' : `${name.replace(/-/g, '_').toUpperCase()}_`;

const parseHosts = (raw: string): RedisHost[] =>
  raw.split(',').map((entry) => {
    const [host, port] = entry.split(':');

    return { host, port: Number(port) };
  });

/**
 * Reads and validates a {@link RedisConfig} from environment variables using the
 * standard names `REDIS_MODE`, `REDIS_HOSTS`, `REDIS_PASSWORD`, `REDIS_DB` and
 * `REDIS_SENTINEL_GROUP_IDENTIFIER`.
 *
 * Pass a `name` to read a named connection from `REDIS_<NAME>_*` instead, which
 * makes it possible to drive several independent connections from the env.
 */
export const redisConfigFromEnv = (options: RedisConfigFromEnvOptions = {}): RedisConfig => {
  const segment = segmentForName(options.name ?? RedisDefaultConnection);
  const env = options.env ?? process.env;

  const key = {
    mode: `REDIS_${segment}MODE`,
    hosts: `REDIS_${segment}HOSTS`,
    password: `REDIS_${segment}PASSWORD`,
    db: `REDIS_${segment}DB`,
    sentinelGroupIdentifier: `REDIS_${segment}SENTINEL_GROUP_IDENTIFIER`,
  };

  const config = createConfig<Record<string, string | number | undefined>>(
    Joi.object({
      [key.mode]: Joi.string()
        .valid(...Object.values(RedisMode))
        .default(RedisMode.Standalone),
      [key.hosts]: Joi.string().required(),
      [key.password]: Joi.string().optional().allow(''),
      [key.db]: Joi.number().when(key.mode, {
        is: RedisMode.Cluster,
        then: Joi.forbidden(),
        otherwise: Joi.optional(),
      }),
      [key.sentinelGroupIdentifier]: Joi.string().when(key.mode, {
        is: RedisMode.Sentinel,
        then: Joi.required(),
        otherwise: Joi.forbidden(),
      }),
    }),
    env,
  );

  const mode = config.get(key.mode) as RedisMode;
  const hosts = parseHosts(config.get(key.hosts) as string);
  const password = config.get(key.password) as string | undefined;

  if (mode === RedisMode.Cluster) {
    return { mode, hosts, password } satisfies RedisClusterConfig;
  }

  if (mode === RedisMode.Sentinel) {
    return {
      mode,
      hosts,
      password,
      database: config.get(key.db) as number | undefined,
      sentinelGroupIdentifier: config.get(key.sentinelGroupIdentifier) as string,
    } satisfies RedisSentinelConfig;
  }

  if (mode === RedisMode.Standalone) {
    return {
      mode,
      hosts,
      password,
      database: config.get(key.db) as number | undefined,
    } satisfies RedisStandaloneConfig;
  }

  throw new TypeError(`Invalid redis mode: ${String(mode)}`);
};
