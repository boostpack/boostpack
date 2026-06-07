import { Inject } from '@nestjs/common';
import { getRedisConfigToken } from '../const';

/**
 * Injects the resolved Redis config of the given connection (default when
 * omitted).
 */
export const InjectRedisConfig = (name?: string) => Inject(getRedisConfigToken(name));
