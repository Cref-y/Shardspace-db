export const CHUNK_SIZE = 1024 * 1024; // 1MB
export const ALGORITHM = 'aes-256-cbc';
export const SECRET_KEY = crypto.randomBytes(32);
export const IV = crypto.randomBytes(16);
