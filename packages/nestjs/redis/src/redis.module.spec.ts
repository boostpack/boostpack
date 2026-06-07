import 'reflect-metadata';

jest.mock('redis', () => {
  const makeClient = () => ({
    on: jest.fn(),
    connect: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined),
    ping: jest.fn().mockResolvedValue('PONG'),
    isReady: true,
    isOpen: true,
  });

  return {
    createClient: jest.fn(makeClient),
    createCluster: jest.fn(makeClient),
    createSentinel: jest.fn(makeClient),
  };
});

import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { createClient, createCluster, createSentinel } from 'redis';
import { RedisMode, getRedisConfigToken, getRedisConnectionToken, getRedisHealthIndicatorToken } from './const';
import { RedisModule } from './redis.module';
import { RedisHealthIndicator } from './redis.health';
import type { INestApplicationContext, DynamicModule } from '@nestjs/common';
import type { RedisConfig } from './type';

type FakeClient = {
  on: jest.Mock;
  connect: jest.Mock;
  close: jest.Mock;
  ping: jest.Mock;
  isReady: boolean;
  isOpen: boolean;
};

const createClientMock = createClient as unknown as jest.Mock;
const createClusterMock = createCluster as unknown as jest.Mock;
const createSentinelMock = createSentinel as unknown as jest.Mock;

const bootstrap = (...modules: DynamicModule[]): Promise<INestApplicationContext> => {
  @Module({ imports: modules })
  class HostModule {}

  return NestFactory.createApplicationContext(HostModule, { logger: false });
};

const standalone: RedisConfig = { mode: RedisMode.Standalone, hosts: [{ host: 'localhost', port: 6379 }] };

describe('RedisModule', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates and connects a standalone connection, resolvable by token', async () => {
    const app = await bootstrap(RedisModule.forRoot({ config: standalone }));

    const client = app.get<FakeClient>(getRedisConnectionToken());

    expect(createClientMock).toHaveBeenCalledTimes(1);
    expect(client.connect).toHaveBeenCalledTimes(1);
    expect(client.on).toHaveBeenCalledWith('error', expect.any(Function));
    expect(app.get(getRedisConfigToken())).toEqual(standalone);
    expect(app.get(getRedisHealthIndicatorToken())).toBeInstanceOf(RedisHealthIndicator);

    await app.close();
  });

  it('uses createCluster for cluster mode', async () => {
    const app = await bootstrap(
      RedisModule.forRoot({ config: { mode: RedisMode.Cluster, hosts: [{ host: 'n1', port: 6379 }] } }),
    );

    expect(createClusterMock).toHaveBeenCalledTimes(1);
    expect(createClientMock).not.toHaveBeenCalled();

    await app.close();
  });

  it('uses createSentinel for sentinel mode', async () => {
    const app = await bootstrap(
      RedisModule.forRoot({
        config: { mode: RedisMode.Sentinel, hosts: [{ host: 's1', port: 26379 }], sentinelGroupIdentifier: 'mymaster' },
      }),
    );

    expect(createSentinelMock).toHaveBeenCalledTimes(1);

    await app.close();
  });

  it('registers independent named connections without collision', async () => {
    const app = await bootstrap(
      RedisModule.forRoot({ name: 'cache', config: standalone }),
      RedisModule.forRoot({ name: 'sessions', config: standalone }),
    );

    const cache = app.get<FakeClient>(getRedisConnectionToken('cache'));
    const sessions = app.get<FakeClient>(getRedisConnectionToken('sessions'));

    expect(createClientMock).toHaveBeenCalledTimes(2);
    expect(cache).not.toBe(sessions);

    await app.close();
  });

  it('builds the config via forRootAsync useFactory', async () => {
    const app = await bootstrap(RedisModule.forRootAsync({ useFactory: () => Promise.resolve(standalone) }));

    expect(app.get(getRedisConfigToken())).toEqual(standalone);
    expect(createClientMock).toHaveBeenCalledTimes(1);

    await app.close();
  });

  it('closes the connection on shutdown by default', async () => {
    const app = await bootstrap(RedisModule.forRoot({ config: standalone }));
    const client = app.get<FakeClient>(getRedisConnectionToken());

    await app.close();

    expect(client.close).toHaveBeenCalledTimes(1);
  });

  it('does not close the connection when closeOnShutdown is false', async () => {
    const app = await bootstrap(RedisModule.forRoot({ config: standalone, closeOnShutdown: false }));
    const client = app.get<FakeClient>(getRedisConnectionToken());

    await app.close();

    expect(client.close).not.toHaveBeenCalled();
  });

  it('returns the client immediately with lazyConnect (background connect)', async () => {
    const app = await bootstrap(RedisModule.forRoot({ config: standalone, lazyConnect: true }));
    const client = app.get<FakeClient>(getRedisConnectionToken());

    expect(client.connect).toHaveBeenCalledTimes(1);

    await app.close();
  });
});
