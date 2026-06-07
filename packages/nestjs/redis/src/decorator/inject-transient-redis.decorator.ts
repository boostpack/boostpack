import { Inject } from '@nestjs/common';
import { getRedisTransientConnectionToken } from '../const';

/**
 * Injects a transient (per-consumer) Redis client of the given connection
 * (default when omitted).
 */
export const InjectTransientRedis = (name?: string) => Inject(getRedisTransientConnectionToken(name));
