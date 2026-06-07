# @boostpack/nestjs-redis

A production-ready, **type-safe** NestJS Redis module built on [node-redis](https://github.com/redis/node-redis). One module, three deployment modes — switch between **standalone**, **sentinel** and **cluster** without touching your code.

## Why

- **Type-safe end to end** — the config is a discriminated union (the compiler knows `sentinelGroupIdentifier` only exists in sentinel mode), and the injected client exposes typed, node-redis commands.
- **Switch Redis modes for free** — `@InjectRedis()` resolves to `RedisClient`, the **intersection** of commands available in standalone, sentinel _and_ cluster. Write your code once against it and move between a single dev instance, a sentinel set, and a production cluster with an env var — no code changes, still fully typed.
- **Effortless config** — `RedisModule.forRoot()` and you're done: it reads the standard `REDIS_*` env vars (validated) and gives you a connected client. Need explicit values or async config? Pass them in.
- **Built-in health checks** — a `RedisHealthIndicator` ready for `@nestjs/terminus`, with **zero runtime dependency** on terminus (it's an optional peer). Recommended for production readiness probes.
- **Resilient by default** — automatic reconnection, a crash-safe `error` handler on every connection (a Redis blip never takes down the process), lifecycle logging via the Nest `Logger`, optional background (`lazyConnect`) startup, and a non-blocking health check.
- **Production essentials** — multiple named connections, validated configuration, graceful shutdown, and singleton/transient clients out of the box.

## Installation

```bash
npm install @boostpack/nestjs-redis redis @nestjs/common joi
```

`redis`, `@nestjs/common` and `joi` are peer dependencies. `@nestjs/terminus` is an **optional** peer — install it only for the health indicator.

## Quick start

```typescript
import { Module } from '@nestjs/common';
import { RedisModule } from '@boostpack/nestjs-redis';

@Module({
  imports: [RedisModule.forRoot()], // reads REDIS_* from the environment
})
export class AppModule {}
```

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRedis, RedisClient } from '@boostpack/nestjs-redis';

@Injectable()
export class UserCache {
  constructor(@InjectRedis() private readonly redis: RedisClient) {}

  async cacheUser(id: string, data: unknown): Promise<void> {
    await this.redis.set(`user:${id}`, JSON.stringify(data), { EX: 3600 });
  }

  async getUser(id: string): Promise<unknown> {
    const cached = await this.redis.get(`user:${id}`);
    return cached ? JSON.parse(cached) : null;
  }
}
```

> Commands use node-redis naming (camelCase): `hSet`, `hGetAll`, `zAdd`, `setEx`, …

A fresh per-consumer connection is available via `@InjectTransientRedis()`.

## Switching modes without changing code

`@InjectRedis()` gives you `RedisClient` — the set of commands guaranteed to exist across **all** deployment modes. The same service works whether Redis is a single instance, sentinel-managed, or a cluster:

```typescript
// works against standalone, sentinel and cluster — picked at runtime by REDIS_MODE
@Injectable()
export class RateLimiter {
  constructor(@InjectRedis() private readonly redis: RedisClient) {}

  async hit(key: string, ttlSeconds: number): Promise<number> {
    const count = await this.redis.incr(key);
    await this.redis.expire(key, ttlSeconds);
    return count;
  }
}
```

```bash
# dev
REDIS_MODE=standalone REDIS_HOSTS=localhost:6379

# production — same code, just env
REDIS_MODE=cluster   REDIS_HOSTS=node1:6379,node2:6379,node3:6379
```

When you genuinely need mode-specific commands, inject a mode-specific type instead:

```typescript
import { RedisClusterClient } from '@boostpack/nestjs-redis';

constructor(@InjectRedis() private readonly redis: RedisClusterClient) {}
```

- `RedisStandaloneClient` / `RedisSentinelClient` — node-redis `RedisClientType` / `RedisSentinelType`.
- `RedisClusterClient` — node-redis `RedisClusterType`.

## Configuration

`forRoot` takes module-level options (`name`, `isGlobal`) and an optional, type-safe `config`. Omit `config` to read it from the environment.

```typescript
import { RedisMode } from '@boostpack/nestjs-redis';

// explicit, type-safe config
RedisModule.forRoot({
  config: { mode: RedisMode.Cluster, hosts: [{ host: 'node1', port: 6379 }] },
});

// async — build the config from a factory with injected deps
RedisModule.forRootAsync({
  inject: [ConfigService],
  useFactory: (cfg: ConfigService) => ({
    mode: RedisMode.Standalone,
    hosts: [{ host: cfg.get('HOST'), port: 6379 }],
  }),
});
```

The config is discriminated by `mode`, so each mode only accepts (and requires) the fields that apply to it:

```typescript
type RedisStandaloneConfig = { mode: RedisMode.Standalone; hosts: RedisHost[]; password?: string; database?: number };
type RedisSentinelConfig = {
  mode: RedisMode.Sentinel;
  hosts: RedisHost[];
  sentinelGroupIdentifier: string;
  password?: string;
  database?: number;
};
type RedisClusterConfig = { mode: RedisMode.Cluster; hosts: RedisHost[]; password?: string };

// each variant also accepts an `options?` passthrough to the matching node-redis factory
// (createClient / createSentinel / createCluster) for advanced settings like
// socket.tls, reconnectStrategy, connectTimeout, username, RESP, etc.
```

### Environment variables

`forRoot()` (and `redisConfigFromEnv()`) read these standard names, validated with [Joi](https://joi.dev) via [`@boostpack/nestjs-config`](../config):

| Variable                          | Required               | Description                                               |
| --------------------------------- | ---------------------- | --------------------------------------------------------- |
| `REDIS_MODE`                      | no (`standalone`)      | `standalone`, `sentinel` or `cluster`.                    |
| `REDIS_HOSTS`                     | yes                    | Comma-separated `host:port` list (e.g. `localhost:6379`). |
| `REDIS_PASSWORD`                  | no                     | Auth password.                                            |
| `REDIS_DB`                        | no (forbidden cluster) | Database index (standalone / sentinel only).             |
| `REDIS_SENTINEL_GROUP_IDENTIFIER` | sentinel only          | Sentinel master group name.                               |

## Multiple connections

Give each connection a `name`. A named connection reads its env vars from `REDIS_<NAME>_*` automatically — no extra wiring:

```typescript
@Module({
  imports: [
    RedisModule.forRoot({ name: 'cache' }), //    reads REDIS_CACHE_*
    RedisModule.forRoot({ name: 'sessions' }), // reads REDIS_SESSIONS_*
  ],
})
export class AppModule {}
```

```typescript
@Injectable()
export class SomeService {
  constructor(
    @InjectRedis('cache') private readonly cache: RedisClient,
    @InjectRedis('sessions') private readonly sessions: RedisClient,
  ) {}
}
```

Named connections accept an explicit `config` too:

```typescript
RedisModule.forRoot({
  name: 'cache',
  config: { mode: RedisMode.Standalone, hosts: [{ host: 'cache-host', port: 6379 }] },
});
```

## Health checks

**Recommended for production** — wire it into your **readiness** probe so orchestrators (e.g. Kubernetes) stop routing traffic to instances whose Redis connection is down, and resume once it recovers. Keep it out of the **liveness** probe: Redis is an external dependency, and a failed liveness check restarts the pod — which won't fix Redis and risks cascading restarts.

`RedisHealthIndicator` is registered automatically and has **no runtime dependency** on `@nestjs/terminus` — it returns a terminus-compatible result. The check is **non-blocking**: if the connection isn't ready it reports `down` immediately instead of queuing a ping that would hang, and the ping is bounded by a timeout (default 1000ms, override with `pingCheck(key, { timeout })`). Inject it with `@InjectRedisHealth(name?)` and plug it into terminus when you want HTTP health checks:

```typescript
import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import { InjectRedisHealth, RedisHealthIndicator } from '@boostpack/nestjs-redis';

@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    @InjectRedisHealth() private readonly redis: RedisHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([() => this.redis.pingCheck('redis')]);
  }
}
```

## Resilience

Every connection is created with an `error` handler attached, so a connection drop or reconnect failure is logged (via the Nest `Logger`, scoped `RedisModule:<name>`) instead of crashing the process with an unhandled `error` event. Lifecycle events (`ready`, `reconnecting`, `closed`) are logged too, and you can observe them yourself:

```typescript
RedisModule.forRoot({
  onError: (error) => metrics.increment('redis.error', { message: error.message }),
  onReady: () => log.info('redis ready'),
});
```

Automatic reconnection is provided by node-redis and enabled by default. On an unexpected socket drop the client reconnects with an exponential backoff (`min(2^retries × 50ms, 2000ms)` plus jitter); commands issued while disconnected are queued and flushed once the connection is restored. Cluster clients additionally rediscover topology on failover. Tune it via `config.options.socket.reconnectStrategy`.

### Startup: `lazyConnect`

By default the connection is awaited during bootstrap. Because node-redis retries indefinitely, **an unreachable Redis blocks startup** until it comes up (or until a bounded `reconnectStrategy` gives up). For resilient startup, set `lazyConnect: true`: the app boots immediately, the connection is established in the background, commands issued meanwhile are queued, and the readiness probe gates traffic until it's ready.

```typescript
RedisModule.forRoot({ lazyConnect: true });
```

## Lifecycle

The module closes the singleton connection on application shutdown by default, in the last shutdown phase (`onApplicationShutdown`, after other providers' teardown) with a graceful `close()`. Enable Nest's shutdown hooks so it also fires on process signals:

```typescript
app.enableShutdownHooks();
```

If your app manages the connection lifecycle itself (e.g. it shares the connection or drains it manually), opt out:

```typescript
RedisModule.forRoot({ closeOnShutdown: false });
```

Transient clients (`@InjectTransientRedis()`) are always owned by the consumer — close them yourself when done.

