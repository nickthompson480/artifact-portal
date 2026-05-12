import { randomBytes } from 'crypto';

// 32 URL-safe base64url chars (~192 bits entropy). Not a UUID — SPEC schema comment is stale.
export const generate = () => randomBytes(24).toString('base64url');
