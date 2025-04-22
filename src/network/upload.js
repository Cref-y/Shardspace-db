/**
 * Handles file upload operations in the ShadSpace network
 */
import { splitToChunks, createFileManifest } from '../storage/chunking.js';
import { encryptChunk, generateEncryptionKey } from '../storage/encryption.js';
import { storeChunk, storeManifest } from '../storage/local-storage.js';
import { createCID } from '../ipld/cid.js';
import { createFileDAG } from '../ipld/merkle-dag.js';
import { storeValue } from '../libp2p/dht.js';
import { replicateChunk } from '../storage/replication.js';
import { publishMessage } from '../libp2p/pubsub.js';

// Default topic for file availability announcements
const FILE_ANNOUNCEMENT_TOPIC = 'shadspace/files/announce';

/**
 * Uploads a file to the ShadSpace network
 * @param {Object} node - Libp2p node
 * @param {Buffer} fileData - File data as buffer
 * @param {string} fileName - Name of the file
 * @param {Object} options - Upload options
 * @returns {Object} - Upload result with file information
 */
export async function uploadFile(node, fileData, fileName, options = {}) {
    const {
        encrypt = true,
        chunkSize = 1024 * 1024, // 1MB
        replicationFactor = 3
    } = options;

    console.log(`Starting upload for file: ${fileName} (${fileData.length} bytes)`);

    // Generate encryption key if encryption is enabled
    const encryptionKey = encrypt ? generateEncryptionKey() : null;

    // Step 1: Split file into chunks
    const chunks = splitToChunks(fileData, chunkSize);
    console.log(`Split file into ${chunks.length} chunks`);

    // Step 2: Process each chunk (encrypt, store, replicate)
    const processedChunks = [];
    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];

        // Encrypt chunk if encryption is enabled
        const processedChunk = encrypt ? encryptChunk(chunk, encryptionKey) : chunk;

        // Store chunk locally
        await storeChunk(processedChunk);

        // Create CID for the chunk
        const chunkCID = createCID(processedChunk.data || processedChunk.encryptedData);

        // Store chunk reference in DHT
        await storeValue(node, `chunk:${chunk.hash}`, node.peerId.toString());

        // Initiate replication for the chunk
        if (replicationFactor > 1) {
            await replicateChunk(node, processedChunk, replicationFactor);
        }

        processedChunks.push({
            hash: chunk.hash,
            cid: chunkCID,
            size: (chunk.data || processedChunk.encryptedData).length
        });

        console.log(`Processed chunk ${i + 1}/${chunks.length}: ${chunk.hash}`);
    }

    // Step 3: Create and store file manifest
    const manifest = createFileManifest(fileData, fileName, chunkSize);
    manifest.encrypted = encrypt;
    if (encrypt) {
        // Store the encryption key in the manifest
        // In a real system, you'd want to encrypt this key with the user's public key
        manifest.encryptionKey = encryptionKey.toString('hex');
    }

    // Add chunk CIDs to manifest
    manifest.chunks = manifest.chunks.map((chunk, i) => ({
        ...chunk,
        cid: processedChunks[i].cid
    }));

    // Store manifest locally
    const manifestId = await storeManifest(manifest);

    // Step 4: Create IPLD DAG for the file
    const chunkCIDs = processedChunks.map(chunk => chunk.cid);
    const fileDAG = createFileDAG(manifest, chunkCIDs);

    // Step 5: Store file reference in DHT
    await storeValue(node, `file:${fileName}`, manifestId);
    await storeValue(node, `manifest:${manifestId}`, node.peerId.toString());

    // Step 6: Announce file availability to the network
    await publishMessage(node, FILE_ANNOUNCEMENT_TOPIC, JSON.stringify({
        action: 'upload',
        fileId: manifestId,
        fileName,
        provider: node.peerId.toString(),
        size: fileData.length,
        chunks: chunks.length,
        rootCID: fileDAG.cid
    }));

    console.log(`File upload complete: ${fileName}, ID: ${manifestId}`);

    return {
        fileId: manifestId,
        fileName,
        size: fileData.length,
        chunks: chunks.length,
        encrypted: encrypt,
        rootCID: fileDAG.cid
    };
}

/**
 * Stores a CID in the ShadSpace network
 * @param {Object} node - Libp2p node
 * @param {string} cid - The CID to store
 * @param {Object} metadata - Metadata associated with the CID
 * @returns {boolean} - Success status
 */
export async function storeCID(node, cid, metadata = {}) {
    if (!node || !cid) {
        throw new Error('Node and CID are required');
    }

    try {
        // Store CID reference in DHT
        const metadataWithPeer = {
            ...metadata,
            provider: node.peerId.toString(),
            timestamp: Date.now()
        };

        await storeValue(node, `cid:${cid}`, JSON.stringify(metadataWithPeer));
        console.log(`Stored CID ${cid} in the network`);
        return true;
    } catch (err) {
        console.error(`Failed to store CID ${cid}:`, err);
        return false;
    }
}