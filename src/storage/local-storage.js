/**
 * Handles local storage operations for the ShadSpace node
 * Manages data persistence and retrieval from the local file system
 */
import { promises as fs } from 'fs';
import path from 'path';
import { createHash } from 'crypto';

// Default storage location
const DEFAULT_STORAGE_DIR = path.join(process.cwd(), '.shadspace-storage');
const CHUNKS_DIR = 'chunks';
const MANIFESTS_DIR = 'manifests';
const METADATA_FILE = 'metadata.json';

/**
 * Ensures all necessary storage directories exist
 * @param {string} baseDir - Base storage directory
 */
export async function initializeStorage(baseDir = DEFAULT_STORAGE_DIR) {
    const dirs = [
        baseDir,
        path.join(baseDir, CHUNKS_DIR),
        path.join(baseDir, MANIFESTS_DIR)
    ];

    for (const dir of dirs) {
        await fs.mkdir(dir, { recursive: true });
    }

    // Initialize metadata file if it doesn't exist
    const metadataPath = path.join(baseDir, METADATA_FILE);
    try {
        await fs.access(metadataPath);
    } catch (err) {
        // File doesn't exist, create it
        await fs.writeFile(metadataPath, JSON.stringify({
            nodeId: createHash('sha256').update(Date.now().toString()).digest('hex'),
            createdAt: new Date().toISOString(),
            totalChunks: 0,
            totalSize: 0,
            files: {}
        }, null, 2));
    }

    console.log(`Storage initialized at ${baseDir}`);
    return baseDir;
}

/**
 * Stores a chunk to local storage
 * @param {Object} chunk - Chunk object with hash and data
 * @param {string} baseDir - Base storage directory
 * @returns {string} - Path where chunk was stored
 */
export async function storeChunk(chunk, baseDir = DEFAULT_STORAGE_DIR) {
    const chunkPath = path.join(baseDir, CHUNKS_DIR, chunk.hash);

    // Check if chunk already exists (deduplication)
    try {
        await fs.access(chunkPath);
        console.log(`Chunk ${chunk.hash} already exists, skipping storage`);
        return chunkPath;
    } catch (err) {
        // Chunk doesn't exist, write it
        await fs.writeFile(chunkPath, chunk.data || chunk.encryptedData);
        console.log(`Stored chunk ${chunk.hash}`);

        // Update metadata
        await updateMetadata(baseDir, metadata => {
            metadata.totalChunks += 1;
            metadata.totalSize += (chunk.data?.length || chunk.encryptedData?.length || 0);
            return metadata;
        });

        return chunkPath;
    }
}

/**
 * Updates the node's metadata
 * @param {string} baseDir - Base storage directory
 * @param {Function} updateFn - Function that takes and returns metadata
 */
async function updateMetadata(baseDir, updateFn) {
    const metadataPath = path.join(baseDir, METADATA_FILE);
    const data = await fs.readFile(metadataPath, 'utf8');
    const metadata = JSON.parse(data);

    const updatedMetadata = updateFn(metadata);
    await fs.writeFile(metadataPath, JSON.stringify(updatedMetadata, null, 2));
}

/**
 * Retrieves a chunk from local storage
 * @param {string} chunkHash - Hash of the chunk to retrieve
 * @param {string} baseDir - Base storage directory
 * @returns {Buffer} - Chunk data
 */
export async function retrieveChunk(chunkHash, baseDir = DEFAULT_STORAGE_DIR) {
    const chunkPath = path.join(baseDir, CHUNKS_DIR, chunkHash);

    try {
        const data = await fs.readFile(chunkPath);
        console.log(`Retrieved chunk ${chunkHash}`);
        return data;
    } catch (err) {
        console.error(`Failed to retrieve chunk ${chunkHash}: ${err.message}`);
        throw new Error(`Chunk ${chunkHash} not found`);
    }
}

/**
 * Stores a file manifest for future retrieval
 * @param {Object} manifest - File manifest object
 * @param {string} baseDir - Base storage directory
 */
export async function storeManifest(manifest, baseDir = DEFAULT_STORAGE_DIR) {
    if (!manifest.id) {
        manifest.id = createHash('sha256')
            .update(JSON.stringify(manifest))
            .digest('hex');
    }

    const manifestPath = path.join(baseDir, MANIFESTS_DIR, manifest.id);
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));

    // Update metadata
    await updateMetadata(baseDir, metadata => {
        metadata.files[manifest.id] = {
            fileName: manifest.fileName,
            size: manifest.size,
            chunks: manifest.chunks.length,
            added: new Date().toISOString()
        };
        return metadata;
    });

    console.log(`Stored manifest for ${manifest.fileName} with ID ${manifest.id}`);
    return manifest.id;
}

/**
 * Retrieves a file manifest from storage
 * @param {string} manifestId - ID of the manifest
 * @param {string} baseDir - Base storage directory
 * @returns {Object} - File manifest
 */
export async function retrieveManifest(manifestId, baseDir = DEFAULT_STORAGE_DIR) {
    const manifestPath = path.join(baseDir, MANIFESTS_DIR, manifestId);

    try {
        const data = await fs.readFile(manifestPath, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error(`Failed to retrieve manifest ${manifestId}: ${err.message}`);
        throw new Error(`Manifest ${manifestId} not found`);
    }
}

/**
 * Gets node storage stats
 * @param {string} baseDir - Base storage directory
 * @returns {Object} - Storage statistics
 */
export async function getStorageStats(baseDir = DEFAULT_STORAGE_DIR) {
    const metadataPath = path.join(baseDir, METADATA_FILE);
    const data = await fs.readFile(metadataPath, 'utf8');
    const metadata = JSON.parse(data);

    return {
        nodeId: metadata.nodeId,
        totalChunks: metadata.totalChunks,
        totalSize: metadata.totalSize,
        fileCount: Object.keys(metadata.files).length,
        createdAt: metadata.createdAt
    };
}