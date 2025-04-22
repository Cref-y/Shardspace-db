/**
 * Handles data replication across the ShadSpace network
 * Ensures data redundancy and availability
 */
import { storeValue, getValue } from '../libp2p/dht.js';
import { publishMessage, subscribeToTopic } from '../libp2p/pubsub.js';
import { storeChunk, retrieveChunk } from './local-storage.js';
import { Readable } from 'stream';

// Topics for pubsub communication
const REPLICATION_REQUEST_TOPIC = 'shadspace/replication/request';
const REPLICATION_RESPONSE_TOPIC = 'shadspace/replication/response';

// Target number of replicas per chunk
const DEFAULT_REPLICATION_FACTOR = 3;

/**
 * Initializes replication subsystem
 * @param {Object} node - Libp2p node
 */
export async function setupReplication(node) {
    // Subscribe to replication requests
    await subscribeToTopic(node, REPLICATION_REQUEST_TOPIC, (message) => {
        handleReplicationRequest(node, JSON.parse(message));
    });

    // Subscribe to replication responses
    await subscribeToTopic(node, REPLICATION_RESPONSE_TOPIC, (message) => {
        handleReplicationResponse(node, JSON.parse(message));
    });

    console.log('Replication subsystem initialized');
}

/**
 * Handles incoming replication requests
 * @param {Object} node - Libp2p node
 * @param {Object} request - Replication request
 */
async function handleReplicationRequest(node, request) {
    const { chunkHash, requester, requestId } = request;

    // Check if we have the requested chunk
    try {
        const chunkData = await retrieveChunk(chunkHash);
        // We have the chunk, respond to request
        await publishMessage(node, REPLICATION_RESPONSE_TOPIC, JSON.stringify({
            requestId,
            chunkHash,
            provider: node.peerId.toString(),
            success: true
        }));

        // Send the actual chunk data through direct connection
        // Here we'd have to establish a direct connection to the requester
        // and send the data through a protocol stream

    } catch (err) {
        // We don't have the chunk
        await publishMessage(node, REPLICATION_RESPONSE_TOPIC, JSON.stringify({
            requestId,
            chunkHash,
            provider: node.peerId.toString(),
            success: false,
            reason: 'Chunk not found'
        }));
    }
}

/**
 * Handles replication responses
 * @param {Object} node - Libp2p node
 * @param {Object} response - Replication response
 */
async function handleReplicationResponse(node, response) {
    const { requestId, chunkHash, provider, success } = response;

    if (success) {
        console.log(`Peer ${provider} has chunk ${chunkHash} from request ${requestId}`);
        // Here we would track successful replication providers
        // and establish direct connection to retrieve the chunk if needed
    }
}

/**
 * Initiates replication of a chunk across the network
 * @param {Object} node - Libp2p node
 * @param {Object} chunk - Chunk to replicate
 * @param {number} replicationFactor - Number of replicas to maintain
 */
export async function replicateChunk(node, chunk, replicationFactor = DEFAULT_REPLICATION_FACTOR) {
    const requestId = `${node.peerId.toString()}-${Date.now()}`;

    // Store chunk hash in DHT to help with discovery
    await storeValue(node, `chunk:${chunk.hash}`, node.peerId.toString());

    // Publish replication request
    await publishMessage(node, REPLICATION_REQUEST_TOPIC, JSON.stringify({
        requestId,
        chunkHash: chunk.hash,
        requester: node.peerId.toString(),
        timestamp: Date.now()
    }));

    console.log(`Replication request sent for chunk ${chunk.hash}`);
    return requestId;
}

/**
 * Checks and maintains the replication factor for a chunk
 * @param {Object} node - Libp2p node
 * @param {string} chunkHash - Hash of the chunk to check
 * @param {number} targetReplicationFactor - Target number of replicas
 */
export async function checkReplicationFactor(node, chunkHash, targetReplicationFactor = DEFAULT_REPLICATION_FACTOR) {
    // Find peers that have the chunk using DHT
    const key = `chunk:${chunkHash}`;
    let providers = [];

    try {
        // Query DHT for peers that have the chunk
        const valueIterator = node.services.dht.get(Buffer.from(key));
        for await (const result of valueIterator) {
            if (result.value) {
                providers.push(new TextDecoder().decode(result.value));
            }
        }
    } catch (err) {
        console.error(`Error querying DHT for chunk ${chunkHash}:`, err);
    }

    providers = [...new Set(providers)]; // Deduplicate providers

    console.log(`Found ${providers.length}/${targetReplicationFactor} replicas for chunk ${chunkHash}`);

    // If we have fewer replicas than target, initiate replication
    if (providers.length < targetReplicationFactor) {
        try {
            const chunk = await retrieveChunk(chunkHash);
            await replicateChunk(node, { hash: chunkHash, data: chunk }, targetReplicationFactor);
        } catch (err) {
            console.error(`Cannot initiate replication for chunk ${chunkHash}:`, err);
        }
    }

    return providers.length;
}

/**
 * Announces stored chunks to the network
 * @param {Object} node - Libp2p node
 * @param {Array<string>} chunkHashes - Array of chunk hashes
 */
export async function announceStoredChunks(node, chunkHashes) {
    console.log(`Announcing ${chunkHashes.length} chunks to the network`);

    for (const hash of chunkHashes) {
        await storeValue(node, `chunk:${hash}`, node.peerId.toString());
    }
}