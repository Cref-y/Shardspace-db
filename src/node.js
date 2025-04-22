console.clear();
console.log(`
███████╗██╗  ██╗ █████╗ ██████╗ ███████╗██████╗  █████╗  ██████╗███████╗
██╔════╝██║  ██║██╔══██╗██╔══██╗██╔════╝██╔══██╗██╔══██╗██╔════╝██╔════╝
███████╗███████║███████║██║  ██║███████╗██████╔╝███████║██║     █████╗  
╚════██║██╔══██║██╔══██║██║  ██║╚════██║██╔═══╝ ██╔══██║██║     ██╔══╝  
███████║██║  ██║██║  ██║██████╔╝███████║██║     ██║  ██║╚██████╗███████╗
╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝ ╚══════╝╚═╝     ╚═╝  ╚═╝ ╚═════╝╚══════╝
=========================================================================
🔥 ShadSpace - Simulated Node Runtime (Infinite Mode) 🔥
=========================================================================
`);

const delay = (ms) => new Promise(res => setTimeout(res, ms));
const now = () => new Date().toLocaleTimeString();

const log = (msg) => console.log(`[${now()}] ${msg}`);

const topics = [
    'shadspace/files/announce',
    'shadspace/files/request',
    'shadspace/files/response',
    'shadspace/replication/request',
    'shadspace/replication/response'
];

// Simulated modules
async function initializeStorage() {
    await delay(200);
    return './simulated/storage';
}

async function getStorageStats() {
    await delay(100);
    return {
        total: '500MB',
        used: `${120 + Math.floor(Math.random() * 50)}MB`,
        available: `${300 + Math.floor(Math.random() * 50)}MB`
    };
}

async function createNode() {
    await delay(300);
    return {
        peerId: {
            toString: () => 'QmSimulatedPeerID1234567890'
        },
        stop: async () => {
            await delay(200);
        }
    };
}

// Simulated networking setup
async function setupDiscovery() {
    await delay(100);
    log('✅ Peer discovery initialized');
}

async function setupDHT() {
    await delay(100);
    log('✅ DHT node initialized');
}

async function addBootstrapPeers(peers) {
    await delay(150);
    log(`✅ Connected to ${peers.length} bootstrap peers`);
}

async function announceNode(peerId) {
    await delay(100);
    log(`✅ Node ${peerId} announced to network`);
}

async function setupRetrievalHandlers() {
    await delay(100);
    log('✅ File retrieval handlers configured');
}

async function setupReplication() {
    await delay(100);
    log('✅ Replication strategy initialized');
}

async function subscribeToTopic(topic) {
    await delay(50);
    log(`✅ Subscribed to topic: ${topic}`);
}

// Periodic simulated activity
async function simulateActivityLoop() {
    while (true) {
        const topic = topics[Math.floor(Math.random() * topics.length)];
        log(`📡 [${topic}] Simulated message received`);

        if (Math.random() < 0.3) {
            const stats = await getStorageStats();
            log(`📦 Storage Stats → Used: ${stats.used} / ${stats.total}`);
        }

        await delay(3000 + Math.random() * 3000); // 3-6s interval
    }
}

// Main boot function
async function startNode() {
    try {
        const storagePath = await initializeStorage();
        log(`📁 Storage initialized at ${storagePath}`);

        const node = await createNode();
        log(`🚀 Node started with PeerID: ${node.peerId.toString()}`);

        await setupDiscovery();
        await setupDHT();
        await addBootstrapPeers([
            'peer1.bootstrap.simulated',
            'peer2.bootstrap.simulated'
        ]);
        await setupRetrievalHandlers();
        await setupReplication();

        for (const topic of topics) {
            await subscribeToTopic(topic);
        }

        await announceNode(node.peerId.toString());

        log('✅ ShadSpace node fully initialized and running.');
        simulateActivityLoop(); // Starts infinite simulation loop
        return node;
    } catch (err) {
        console.error('❌ Failed to start node:', err);
        process.exit(1);
    }
}

// Start the node
const nodePromise = startNode();

// Graceful shutdown
process.on('SIGINT', async () => {
    try {
        const node = await nodePromise;
        log('🛑 Shutting down...');
        await node.stop();
        log('👋 Node stopped. Goodbye!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Shutdown error:', err);
        process.exit(1);
    }
});
