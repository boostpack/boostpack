/* eslint-disable sonarjs/no-hardcoded-passwords -- test fixtures, not real credentials */
import { redisConfigFromEnv } from './redis-config-from-env';
import { RedisMode } from '../const';

describe('redisConfigFromEnv', () => {
  it('parses comma-separated hosts into host/port pairs', () => {
    const config = redisConfigFromEnv({ env: { REDIS_HOSTS: 'localhost:6379,127.0.0.1:6380' } });

    expect(config.hosts).toEqual([
      { host: 'localhost', port: 6379 },
      { host: '127.0.0.1', port: 6380 },
    ]);
  });

  it('defaults to standalone mode', () => {
    const config = redisConfigFromEnv({
      env: { REDIS_HOSTS: 'localhost:6379', REDIS_PASSWORD: 'secret', REDIS_DB: '2' },
    });

    expect(config).toMatchObject({ mode: RedisMode.Standalone, password: 'secret', database: 2 });
  });

  it('builds a cluster config', () => {
    const config = redisConfigFromEnv({
      env: { REDIS_MODE: RedisMode.Cluster, REDIS_HOSTS: 'node1:6379,node2:6379', REDIS_PASSWORD: 'secret' },
    });

    expect(config).toEqual({
      mode: RedisMode.Cluster,
      hosts: [
        { host: 'node1', port: 6379 },
        { host: 'node2', port: 6379 },
      ],
      password: 'secret',
    });
  });

  it('builds a sentinel config with group identifier', () => {
    const config = redisConfigFromEnv({
      env: {
        REDIS_MODE: RedisMode.Sentinel,
        REDIS_HOSTS: 'sentinel1:26379,sentinel2:26379',
        REDIS_SENTINEL_GROUP_IDENTIFIER: 'mymaster',
        REDIS_DB: '0',
      },
    });

    expect(config).toMatchObject({ mode: RedisMode.Sentinel, sentinelGroupIdentifier: 'mymaster', database: 0 });
  });

  it('reads a named connection from REDIS_<NAME>_* vars', () => {
    const config = redisConfigFromEnv({
      name: 'cache',
      env: { REDIS_CACHE_HOSTS: 'cache-host:6379', REDIS_HOSTS: 'ignored:6379' },
    });

    expect(config.hosts).toEqual([{ host: 'cache-host', port: 6379 }]);
  });

  it('uppercases and normalizes the connection name in env var keys', () => {
    const config = redisConfigFromEnv({
      name: 'user-sessions',
      env: { REDIS_USER_SESSIONS_HOSTS: 'session-host:6380', REDIS_USER_SESSIONS_MODE: RedisMode.Standalone },
    });

    expect(config).toMatchObject({
      mode: RedisMode.Standalone,
      hosts: [{ host: 'session-host', port: 6380 }],
    });
  });

  it('throws when the hosts var is missing', () => {
    expect(() => redisConfigFromEnv({ env: {} })).toThrow(/Config validation failed/);
  });

  it('throws when sentinel mode lacks a group identifier', () => {
    expect(() =>
      redisConfigFromEnv({ env: { REDIS_MODE: RedisMode.Sentinel, REDIS_HOSTS: 'sentinel1:26379' } }),
    ).toThrow(/Config validation failed/);
  });
});
