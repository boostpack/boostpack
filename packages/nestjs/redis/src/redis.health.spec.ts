/* eslint-disable sonarjs/no-hardcoded-ip -- test fixtures, not real addresses */
import { RedisHealthIndicator } from './redis.health';
import type { RedisAnyClient } from './type';

type FakeClient = {
  isReady?: boolean;
  isOpen?: boolean;
  ping: () => Promise<unknown>;
};

const indicatorFor = (client: FakeClient): RedisHealthIndicator =>
  new RedisHealthIndicator(client as unknown as RedisAnyClient);

describe('RedisHealthIndicator', () => {
  it('reports up when ready and ping replies PONG', async () => {
    const health = indicatorFor({ isReady: true, ping: () => Promise.resolve('PONG') });

    await expect(health.pingCheck()).resolves.toEqual({ redis: { status: 'up' } });
  });

  it('uses a custom key', async () => {
    const health = indicatorFor({ isReady: true, ping: () => Promise.resolve('PONG') });

    await expect(health.pingCheck('cache')).resolves.toEqual({ cache: { status: 'up' } });
  });

  it('reports down without pinging when the connection is not ready', async () => {
    const ping = jest.fn(() => Promise.resolve('PONG'));
    const health = indicatorFor({ isReady: false, ping });

    await expect(health.pingCheck()).resolves.toEqual({
      redis: { status: 'down', message: 'connection is not ready' },
    });

    expect(ping).not.toHaveBeenCalled();
  });

  it('falls back to isOpen when isReady is absent (cluster)', async () => {
    const health = indicatorFor({ isOpen: true, ping: () => Promise.resolve('PONG') });

    await expect(health.pingCheck()).resolves.toEqual({ redis: { status: 'up' } });
  });

  it('reports down on an unexpected ping reply', async () => {
    const health = indicatorFor({ isReady: true, ping: () => Promise.resolve('nope') });

    await expect(health.pingCheck()).resolves.toMatchObject({ redis: { status: 'down' } });
  });

  it('reports the error code without leaking host/IP when ping rejects', async () => {
    const error = Object.assign(new Error('connect ECONNREFUSED 10.0.0.5:6379'), { code: 'ECONNREFUSED' });
    const health = indicatorFor({ isReady: true, ping: () => Promise.reject(error) });

    const result = await health.pingCheck();

    expect(result).toEqual({ redis: { status: 'down', message: 'ECONNREFUSED' } });
    expect(String(result.redis.message)).not.toContain('10.0.0.5');
  });

  it('redacts IPv4 addresses from codeless error messages', async () => {
    const health = indicatorFor({ isReady: true, ping: () => Promise.reject(new Error('failed at 10.0.0.5:6379')) });

    const result = await health.pingCheck();

    expect(String(result.redis.message)).toBe('failed at <redacted>');
    expect(String(result.redis.message)).not.toContain('10.0.0.5');
  });

  it('reports down with the timeout reason when ping exceeds the timeout', async () => {
    const health = indicatorFor({ isReady: true, ping: () => new Promise(() => undefined) });

    const result = await health.pingCheck('redis', { timeout: 10 });

    expect(result.redis.status).toBe('down');
    expect(String(result.redis.message)).toContain('timed out');
  });
});
