import bcrypt from 'bcryptjs';

export const hash = (pw, rounds = 12) => bcrypt.hash(pw, rounds);
export const compare = (pw, h) => bcrypt.compare(pw, h);
