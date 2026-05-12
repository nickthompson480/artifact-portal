import { verify } from '../lib/tokens.js';

const CLEAR_OPTS = { httpOnly: true, sameSite: 'lax', secure: false, path: '/' };

export function requireAuth(req, res, next) {
  const token = req.cookies?.auth_token;
  if (!token) return res.status(401).json({ code: 'UNAUTHORIZED' });
  try {
    req.user = verify(token);
    next();
  } catch {
    res.clearCookie('auth_token', CLEAR_OPTS);
    return res.status(401).json({ code: 'UNAUTHORIZED' });
  }
}
