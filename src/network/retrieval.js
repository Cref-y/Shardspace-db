/**
 * Handles file retrieval operations in the ShadSpace network
 */
import { getValue } from '../libp2p/dht.js';
import { publishMessage, subscribeToTopic } from '../libp2p/pubsub.js';
import { retrieveChunk, retrieveManifest } from '../storage/local-storage.js';
import { reassembleChunks } from '../storage/chunking.js';
import { decryptChunk } from '../storage/encryption.js';

// Topics for retrieval communication
const FILE_REQUEST_TOPIC = 'shadspace/files/request';
const FILE_RESPONSE_TOPIC = 'shadspace/files/response';
const CHUNK_REQUEST_TOPIC = 'shadspace/chunks/request';
const CHUNK_RESPONSE_TOPIC = 'shadspace/chunks/response';

/**
 * Sets up listeners for file and chunk requests
 * @param {Object} node - Libp2p node
 */
export async function setupRetrievalHandlers(node) {
    // Listen for file requests
    await subscribeToTopic(node, FILE_REQUEST_TOPIC, async (message) => {
        const request = JSON.parse(message);
        await handleFileRequest(node, request);
    });

    // Listen for chunk requests
    await subscribeToTopic(node, CHUNK_REQUEST_TOPIC, async (message) => {
        const request = JSON.parse(message);
        await handleChunkRequest(node, request);
    });

    console.log('Retrieval handlers initialized');
}

/**
 * Handles file manifest requests
 * @param {Object} node - Libp2p node
 * @param {Object} request - File request
 */
async function handleFileRequest(node, request) {
    const { fileId, requester, requestId } = request;

    try {
        // Check if we have the requested manifest
        const manifest = await retrieveManifest(fileId);

        // Respond that we have the file
        await publishMessage(node, FILE_RESPONSE_TOPIC, JSON.stringify({
            requestId,
            fileId,
            provider: node.peerId.toString(),
            success: true,
            manifest: {
                fileName: manifest.fileName,
                size: manifest.size,
                chunks: manifest.chunks.length,
                encrypted: manifest.encrypted
            }
        }));

        console.log(`Responded to file request for ${fileId}`);
    } catch (err) {
        // We don't have the file
        await publishMessage(node, FILE_RESPONSE_TOPIC, JSON.stringify({
            requestId,
            fileId,
            provider: node.peerId.toString(),
            success: false,
            reason: 'File not found'
        }));
    }
}

/**
 * Handles chunk requests
 * @param {Object} node - Libp2p node
 * @param {Object} request - Chunk request
 */
async function handleChunkRequest(node, request) {
    const { chunkHash, requester, requestId } = request;

    try {
        // Check if we have the requested chunk
        const chunkData = await retrieveChunk(chunkHash);

        // Respond that we have the chunk
        await publishMessage(node, CHUNK_RESPONSE_TOPIC, JSON.stringify({
            requestId,
            chunkHash,
            provider: node.peerId.toString(),
            success: true,
            size: chunkData.length
        }));

        // The actual data would be sent through a direct connection
        // This is a placeholder for the actual data transfer

        console.log(`Responded to chunk request for ${chunkHash}`);
    } catch (err) {
        // We don't have the chunk
        await publishMessage(node, CHUNK_RESPONSE_TOPIC, JSON.stringify({
            requestId,
            chunkHash,
            provider: node.peerId.toString(),
            success: false,
            reason: 'Chunk not found'
        }));
    }
}

/**
 * Retrieves a file from the ShadSpace network
 * @param {Object} node - Libp2p node
 * @param {string} fileId - ID of the file to retrieve
 * @returns {Object} - Retrieved file data
 */
export async function retrieveFile(node, fileId) {
    console.log(`Starting retrieval for file: ${fileId}`);

    // Step 1: Find peers that have the file manifest
    const manifestKey = `manifest:${fileId}`;
    let manifestProviders = [];

    try {
        // Query DHT for manifest providers
        const valueIterator = node.services.dht.get(Buffer.from(manifestKey));
        for await (const result of valueIterator) {
            if (result.value) {
                manifestProviders.push(new TextDecoder().decode(result.value));
            }
        }
    } catch (err) {
        console.error(`Error querying DHT for file ${fileId}:`, err);
    }

    if (manifestProviders.length === 0) {
        throw new Error(`File ${fileId} not found in the network`);
    }

    console.log(`Found ${manifestProviders.length} providers for file ${fileId}`);

    // Step 2: Request manifest from a provider or try local storage
    let manifest;
    try {
        // Try local storage first
        manifest = await retrieveManifest(fileId);
        console.log(`Retrieved file manifest from local storage: ${fileId}`);
    } catch (err) {
        // Request from network
        const requestId = `${node.peerId.toString()}-${Date.now()}`;

        // Publish file request
        await publishMessage(node, FILE_REQUEST_TOPIC, JSON.stringify({
            requestId,
            fileId,
            requester: node.peerId.toString()
        }));

        // In a real implementation, we'd wait for responses and fetch the manifest
        // For this example, we'll throw an error
        throw new Error(`File manifest ${fileId} not available locally. Network retrieval not implemented.`);
    }

    // Step 3: Retrieve each chunk
    const chunks = [];
    const totalChunks = manifest.chunks.length;

    for (let i = 0; i < totalChunks; i++) {
        const chunkInfo = manifest.chunks[i];
        const chunkHash = chunkInfo.hash;

        try {
            // Try local storage first
            let chunkData = await retrieveChunk(chunkHash);

            // If encrypted, decrypt the chunk
            if (manifest.encrypted && manifest.encryptionKey) {
                const encryptionKey = Buffer.from(manifest.encryptionKey, 'hex');
                const encryptedChunk = {
                    hash: chunkHash,
                    encryptedData: chunkData,
                    iv: chunkInfo.iv,
                    authTag: chunkInfo.authTag
                };

                const decryptedChunk = decryptChunk(encryptedChunk, encryptionKey);
                chunkData = decryptedChunk.data;
            }

            chunks.push({
                hash: chunkHash,
                data: chunkData
            });

            console.log(`Retrieved chunk ${i + 1}/${totalChunks} from local storage: ${chunkHash}`);
        } catch (err) {
            // Request from network - in a real implementation, we'd do this
            console.error(`Chunk ${chunkHash} not available locally. Network retrieval not implemented.`);
            throw new Error(`Chunk ${chunkHash} not available.`);
        }
    }

    // Step 4: Reassemble file from chunks
    const fileData = reassembleChunks(chunks);

    console.log(`File retrieval complete: ${manifest.fileName}, size: ${fileData.length} bytes`);

    return {
        fileName: manifest.fileName,
        data: fileData,
        size: fileData.length,
        manifest
    };
}

/**
 * Locates a file in the network by name
 * @param {Object} node - Libp2p node
 * @param {string} fileName - Name of the file to find
 * @returns {Array} - Array of file references
 */
export async function locateFileByName(node, fileName) {
    console.log(`Searching for file: ${fileName}`);

    const fileKey = `file:${fileName}`;
    const fileRefs = [];

    try {
        // Query DHT for file references
        const valueIterator = node.services.dht.get(Buffer.from(fileKey));
        for await (const result of valueIterator) {
            if (result.value) {
                const manifestId = new TextDecoder().decode(result.value);
                fileRefs.push({
                    fileName,
                    manifestId,
                    provider: result.from?.toString()
                });
            }
        }
    } catch (err) {
        console.error(`Error searching for file ${fileName}:`, err);
        return [];
    }

    console.log(`Found ${fileRefs.length} references for file ${fileName}`);
    return fileRefs;
}