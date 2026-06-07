import type { RedisClientType, RedisClusterType, RedisSentinelType } from 'redis';

/**
 * Every command and method common to all three node-redis client variants
 * (standalone, sentinel and cluster). Derived directly from node-redis, so the
 * set is always complete and never drifts as commands are added.
 */
type RedisCommonKeys = keyof RedisClientType & keyof RedisClusterType & keyof RedisSentinelType;

/**
 * Standalone node-redis client.
 */
export type RedisStandaloneClient = RedisClientType;

/**
 * Sentinel-backed node-redis client (proxies commands to the current master).
 */
export type RedisSentinelClient = RedisSentinelType;

/**
 * node-redis Cluster client.
 */
export type RedisClusterClient = RedisClusterType;

/**
 * Default Redis client type — the intersection of everything available across
 * standalone, sentinel and cluster modes. This is what {@link InjectRedis}
 * resolves to, so code written against it works regardless of deployment mode.
 */
export type RedisClient = Pick<RedisClientType | RedisClusterType | RedisSentinelType, RedisCommonKeys>;

/**
 * Any of the concrete node-redis clients. Used internally as the connection
 * factory's return type.
 */
export type RedisAnyClient = RedisClientType | RedisClusterType | RedisSentinelType;
