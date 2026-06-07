import { Inject } from '@nestjs/common';
import { getRedisHealthIndicatorToken } from '../const';

/**
 * Injects the Redis health indicator bound to the given connection (default
 * when omitted).
 */
export const InjectRedisHealth = (name?: string) => Inject(getRedisHealthIndicatorToken(name));
