/**
 * Handles file chunking for efficient storage and retrieval
 * Uses content-defined chunking for deduplication benefits
 */
import { createHash } from 'crypto';

// Default chunk size in bytes (1MB)
const DEFAULT_CHUNK_SIZE = 1024 * 1024;

/**
 * Splits a file buffer into chunks of approximately equal size
 * @param {Buffer} data - The file data to chunk
 * @param {number} targetSize - Target size for chunks in bytes
 * @returns {Array<{data: Buffer, hash: string}>} Array of chunks with their hash
 */
export function splitToChunks(data, targetSize = DEFAULT_CHUNK_SIZE) {
    if (!Buffer.isBuffer(data)) {
        if (typeof data === 'string') {
            data = Buffer.from(data);
        } else {
            throw new Error('Data must be a Buffer or string');
        }
    }

    const chunks = [];
    let offset = 0;

    while (offset < data.length) {
        // Calculate end position (either target size or end of data)
        const end = Math.min(offset + targetSize, data.length);
        const chunk = data.slice(offset, end);

        // Generate hash for the chunk (used for deduplication and content addressing)
        const hash = createHash('sha256').update(chunk).digest('hex');

        chunks.push({
            data: chunk,
            hash
        });

        offset = end;
    }

    console.log(`Split data into ${chunks.length} chunks`);
    return chunks;
}

/**
 * Reassembles chunks back into the original data
 * @param {Array<Buffer>} chunks - Array of data chunks
 * @returns {Buffer} - Reassembled file data
 */
export function reassembleChunks(chunks) {
    if (!Array.isArray(chunks) || chunks.length === 0) {
        throw new Error('Invalid chunks array provided');
    }

    // Extract data buffers from chunk objects if needed
    const buffers = chunks.map(chunk => chunk.data ? chunk.data : chunk);

    // Combine all chunks into one buffer
    const reassembled = Buffer.concat(buffers);
    console.log(`Reassembled ${chunks.length} chunks into ${reassembled.length} bytes`);

    return reassembled;
}

/**
 * Generates a manifest of chunks from a file
 * @param {Buffer} data - The file data
 * @param {number} chunkSize - Size of each chunk in bytes
 * @returns {Object} - Manifest containing file metadata and chunk references
 */
export function createFileManifest(data, fileName, chunkSize = DEFAULT_CHUNK_SIZE) {
    const chunks = splitToChunks(data, chunkSize);

    return {
        fileName,
        size: data.length,
        created: new Date().toISOString(),
        chunkSize,
        chunks: chunks.map(chunk => ({
            hash: chunk.hash,
            size: chunk.data.length
        }))
    };
}