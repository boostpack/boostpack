import { expectTypeOf } from 'expect-type';
import type { RedisClient, RedisClusterClient, RedisSentinelClient, RedisStandaloneClient } from './redis-client.type';
import type { RedisClusterType, RedisClientType, RedisSentinelType } from 'redis';

describe('RedisClient types', () => {
  it('exposes commands common to every deployment mode', () => {
    expectTypeOf<RedisClient>().toHaveProperty('get');
    expectTypeOf<RedisClient>().toHaveProperty('set');
    expectTypeOf<RedisClient>().toHaveProperty('del');
    expectTypeOf<RedisClient>().toHaveProperty('expire');
    expectTypeOf<RedisClient>().toHaveProperty('incr');
    expectTypeOf<RedisClient>().toHaveProperty('hSet');
    expectTypeOf<RedisClient>().toHaveProperty('hGetAll');
    expectTypeOf<RedisClient>().toHaveProperty('zAdd');
    expectTypeOf<RedisClient>().toHaveProperty('sAdd');
    expectTypeOf<RedisClient>().toHaveProperty('publish');
    expectTypeOf<RedisClient>().toHaveProperty('ping');
  });

  it('maps the mode-specific aliases to the node-redis client types', () => {
    expectTypeOf<RedisStandaloneClient>().toEqualTypeOf<RedisClientType>();
    expectTypeOf<RedisSentinelClient>().toEqualTypeOf<RedisSentinelType>();
    expectTypeOf<RedisClusterClient>().toEqualTypeOf<RedisClusterType>();
  });
});
