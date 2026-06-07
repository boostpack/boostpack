import type { RedisClientOptions, RedisClusterOptions, RedisSentinelOptions } from 'redis';
import { RedisMode } from '../const';

/**
 * A single Redis endpoint (host/port pair). Used for standalone hosts, sentinel
 * nodes and cluster nodes alike.
 */
export type RedisHost = {
  host: string;
  port: number;
};

/**
 * Configuration for a Redis Cluster connection.
 *
 * `options` is passed through to node-redis `createCluster`; the fields managed
 * here (`hosts` → `rootNodes`, `password` → `defaults.password`) take precedence
 * over anything set in it.
 */
export type RedisClusterConfig = {
  mode: RedisMode.Cluster;
  hosts: RedisHost[];
  password?: string;
  options?: Omit<RedisClusterOptions, 'rootNodes'>;
};

/**
 * Configuration for a Sentinel-managed Redis connection.
 *
 * `options` is passed through to node-redis `createSentinel`; the fields managed
 * here (`hosts` → `sentinelRootNodes`, `sentinelGroupIdentifier` → `name`,
 * `password`/`database` → `nodeClientOptions`) take precedence over anything set
 * in it.
 */
export type RedisSentinelConfig = {
  mode: RedisMode.Sentinel;
  hosts: RedisHost[];
  sentinelGroupIdentifier: string;
  password?: string;
  database?: number;
  options?: Omit<RedisSentinelOptions, 'name' | 'sentinelRootNodes'>;
};

/**
 * Configuration for a single standalone Redis instance.
 *
 * `options` is passed through to node-redis `createClient`; the fields managed
 * here (`hosts[0]` → `socket.host`/`socket.port`, `password`, `database`) take
 * precedence over anything set in it.
 */
export type RedisStandaloneConfig = {
  mode: RedisMode.Standalone;
  hosts: RedisHost[];
  password?: string;
  database?: number;
  options?: Omit<RedisClientOptions, 'url' | 'password' | 'database'>;
};

/**
 * Discriminated union of all supported Redis connection configurations.
 */
export type RedisConfig = RedisClusterConfig | RedisSentinelConfig | RedisStandaloneConfig;
