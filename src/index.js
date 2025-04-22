/**
 * ShadSpace - A Decentralized Storage Network
 * Main entry point
 */
import { createNode } from './libp2p/node.js';
import { setupDiscovery, addBootstrapPeers, announceNode } from './network/discovery.js';
import { setupDHT } from './libp2p/dht.js';
import { initializeStorage, getStorageStats } from './storage/local-storage.js';
import { setupRetrievalHandlers } from './network/retrieval.js';
import { setupReplication } from './storage/replication.js';
import { subscribeToTopic } from './libp2p/pubsub.js';

// Clear console and show banner
console.clear();
console.log(`
███████╗██╗  ██╗ █████╗ ██████╗ ███████╗██████╗  █████╗  ██████╗███████╗
██╔════╝██║  ██║██╔══██╗██╔══██╗██╔════╝██╔══██╗██╔══██╗██╔════╝██╔════╝
███████╗███████║███████║██║  ██║███████╗██████╔╝███████║██║     █████╗  
╚════██║██╔══██║██╔══██║██║  ██║╚════██║██╔═══╝ ██╔══██║██║     ██╔══╝  
███████║██║  ██║██║  ██║██████╔╝███████║██║     ██║  ██║╚██████╗███████╗
╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝ ╚══════╝╚═╝     ╚═╝  ╚═╝ ╚═════╝╚══════╝
=========================================================================
🔥 ShadSpace - A Decentralized Storage Network 🔥
=========================================================================
`);

// Bootstrap peers - replace with your actual bootstrap nodes in production
const bootstrapPeers = [
    '/ip4/104.131.131.82/tcp/4001/p2p/QmaCpDMGvV2BGHeYERUEnRQAwe3N8SzbUtfsmvsqQLuvuJ',
    '/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN'
];

// List of topics to subscribe to
const topics = [
    'shadspace/files/announce',
    'shadspace/files/request',
    'shadspace/files/response',
    'shadspace/replication/request',
    'shadspace/replication/response'
];

/**
 * Initialize and start the ShadSpace node
 */
async function startNode() {
    try {
        // Step 1: Initialize local storage
        const storageDir = await initializeStorage();
        console.log(`Storage initialized at ${storageDir}`);

        // Step 2: Create and start libp2p node
        const node = await createNode();
        console.log(`Node created with PeerID: ${node.peerId.toString()}`);

        // Step 3: Set up discovery and DHT
        await setupDiscovery(node);
        await setupDHT(node);

        // Step 4: Add bootstrap peers for initial network connection
        await addBootstrapPeers(node, bootstrapPeers);

        // Step 5: Set up retrieval handlers
        await setupRetrievalHandlers(node);

        // Step 6: Set up replication system
        await setupReplication(node);

        // Step 7: Subscribe to network topics
        for (const topic of topics) {
            await subscribeToTopic(node, topic, (message) => {
                console.log(`[${topic}] Message received`);
            });
        }

        // Step 8: Announce node to the network
        await announceNode(node);

        // Step 9: Print storage stats
        const stats = await getStorageStats();
        console.log('Storage stats:', stats);

        console.log('ShadSpace node is running...');

        return node;
    } catch (error) {
        console.error('Failed to start ShadSpace node:', error);
        process.exit(1);
    }
}

// Start the node
const nodePromise = startNode();

// Handle process exit
process.on('SIGINT', async () => {
    try {
        const node = await nodePromise;
        console.log('Shutting down ShadSpace node...');
        await node.stop();
        console.log('Node stopped. Goodbye!');
        process.exit(0);
    } catch (err) {
        console.error('Error during shutdown:', err);
        process.exit(1);
    }
});

export default nodePromise;