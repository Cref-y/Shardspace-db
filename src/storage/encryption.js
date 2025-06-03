/**
 * Handles encryption and decryption of stored data
 * Uses AES-GCM for authenticated encryption
 */
import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';

// AES-256-GCM is used for encryption
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 12;  // Standard for GCM
const AUTH_TAG_LENGTH = 16; // GCM auth tag

/**
 * Generates a new encryption key
 * @returns {Buffer} A random encryption key
 */
export function generateEncryptionKey() {
    return randomBytes(KEY_LENGTH);
}

/**
 * Encrypts data using AES-GCM
 * @param {Buffer|string} data - Data to encrypt
 * @param {Buffer} key - Encryption key (32 bytes)
 * @returns {Object} Encrypted data with metadata needed for decryption
 */
export function encryptData(data, key) {
    if (!Buffer.isBuffer(data)) {
        data = Buffer.from(data);
    }

    if (!key || key.length !== KEY_LENGTH) {
        throw new Error(`Encryption key must be ${KEY_LENGTH} bytes`);
    }

    // Generate a random initialization vector
    const iv = randomBytes(IV_LENGTH);

    // Create cipher
    const cipher = createCipheriv(ALGORITHM, key, iv);

    // Encrypt the data
    const encryptedData = Buffer.concat([
        cipher.update(data),
        cipher.final()
    ]);

    // Get authentication tag
    const authTag = cipher.getAuthTag();

    return {
        encryptedData,
        iv,
        authTag,
        algorithm: ALGORITHM
    };
}

/**
 * Decrypts data using AES-GCM
 * @param {Object} encryptedPackage - Package containing encrypted data and metadata
 * @param {Buffer} key - Decryption key
 * @returns {Buffer} Decrypted data
 */
export function decryptData({ encryptedData, iv, authTag, algorithm = ALGORITHM }, key) {
    if (algorithm !== ALGORITHM) {
        throw new Error(`Unsupported encryption algorithm: ${algorithm}`);
    }

    if (!key || key.length !== KEY_LENGTH) {
        throw new Error(`Decryption key must be ${KEY_LENGTH} bytes`);
    }

    // Create decipher
    const decipher = createDecipheriv(algorithm, key, iv);
    decipher.setAuthTag(authTag);

    // Decrypt the data
    return Buffer.concat([
        decipher.update(encryptedData),
        decipher.final()
    ]);
}

/**
 * Creates a wrapped encrypted chunk with all metadata needed for decryption
 * @param {Buffer} data - Raw chunk data
 * @param {Buffer} key - Encryption key
 * @returns {Object} Encrypted chunk with metadata
 */
export function encryptChunk(chunk, key) {
    const { encryptedData, iv, authTag } = encryptData(chunk.data, key);

    return {
        hash: chunk.hash,          // Original hash of unencrypted data
        encryptedData,
        iv: iv.toString('base64'),
        authTag: authTag.toString('base64')
    };
}

/**
 * Decrypts a chunk and returns the original data
 * @param {Object} encryptedChunk - Encrypted chunk with metadata
 * @param {Buffer} key - Decryption key
 * @returns {Object} Decrypted chunk
 */
export function decryptChunk(encryptedChunk, key) {
    const decrypted = decryptData({
        encryptedData: encryptedChunk.encryptedData,
        iv: Buffer.from(encryptedChunk.iv, 'base64'),
        authTag: Buffer.from(encryptedChunk.authTag, 'base64')
    }, key);

    return {
        hash: encryptedChunk.hash,
        data: decrypted
    };
}March