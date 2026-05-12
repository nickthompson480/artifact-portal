import jwt from 'jsonwebtoken';
import { resolveJwtSecret } from './config.js';

// Lazy — never reads secret at module-eval time, avoiding circular imports
// and ensuring ensureDirs() has run before any file I/O in resolveJwtSecret.
let _secret = null;
const secret = () => _secret ?? (_secret = resolveJwtSecret());

export const sign = (payload, expiresIn = '7d') =>
  jwt.sign(payload, secret(), { expiresIn });

export const verify = (token) => jwt.verify(token, secret());
