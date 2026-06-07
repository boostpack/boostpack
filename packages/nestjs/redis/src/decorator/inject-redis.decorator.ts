import { Inject } from '@nestjs/common';
import { getRedisConnectionToken } from '../const';

/**
 * Injects the singleton Redis client of the given connection (default when
 * omitted).
 */
export const InjectRedis = (name?: string) => Inject(getRedisConnectionToken(name));
