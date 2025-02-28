import crypto from 'crypto';
import { ALGORITHM, SECRET_KEY, IV } from './config.js';

export function encryptChunk(chunk) {
    const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, IV);
    return Buffer.concat([cipher.update(chunk), cipher.final()]);
}

export function decryptChunk(encryptedChunk) {
    const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, IV);
    return Buffer.concat([decipher.update(encryptedChunk), decipher.final()]);
}

export function computeHash(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
}
