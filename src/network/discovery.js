import { multiaddr } from '@multiformats/multiaddr';

export async function setupDiscovery(node) {
    if (!node) throw new Error('Node is required to setup peer discovery.');

    console.log('🔍 Setting up peer discovery...');

    node.addEventListener('peer:discovery', async (evt) => {
        const peerInfo = evt.detail;
        const peerId = peerInfo.id.toString();

        console.log(`👀 Discovered peer: ${peerId}`);

        try {
            // Get the first available multiaddress
            const peerAddr = peerInfo.multiaddrs[0];
            if (!peerAddr) {
                console.log(`No address available for peer ${peerId}`);
                return;
            }

            console.log(`🔗 Attempting to dial ${peerId} at ${peerAddr}`);
            await node.dial(peerAddr);
            console.log(`✅ Successfully connected to ${peerId}`);
        } catch (err) {
            console.error(`❌ Failed to connect to ${peerId}:`, err.message);
        }
    });

    console.log('✅ Peer discovery setup complete.');
}

export async function addBootstrapPeers(node, bootstrapPeers = []) {
    if (!node) throw new Error('Node is required to add bootstrap peers.');

    if (bootstrapPeers.length === 0) {
        console.log('⚠️ No bootstrap peers provided.');
        return;
    }

    console.log('🚀 Adding bootstrap peers...');

    const successfulConnections = [];

    for (const peer of bootstrapPeers) {
        try {
            console.log(`🔗 Connecting to bootstrap peer: ${peer}`);
            const peerAddr = multiaddr(peer);

            // Convert to PeerId first
            const peerIdStr = peerAddr.getPeerId();
            if (!peerIdStr) {
                console.error(`Invalid peer address: ${peer}`);
                continue;
            }

            await node.dial(peerAddr);
            successfulConnections.push(peer);
            console.log(`✅ Connected to ${peer}`);
        } catch (err) {
            console.error(`❌ Failed to connect to bootstrap peer ${peer}:`, err.message);
        }
    }

    console.log(`✅ ${successfulConnections.length}/${bootstrapPeers.length} bootstrap peers connected`);
    return successfulConnections;
}

/**
 * Announces this node to the network
 * @param {Object} node - The libp2p node
 */
export async function announceNode(node) {
    if (!node) {
        throw new Error('Node is required for announcement');
    }

    // Get the node's multiaddresses
    const addresses = node.getMultiaddrs().map(ma => ma.toString());

    // Store node info in DHT
    const nodeInfo = {
        id: node.peerId.toString(),
        addresses,
        timestamp: Date.now()
    };

    await node.services.dht.put(
        Buffer.from(`node:${node.peerId.toString()}`),
        Buffer.from(JSON.stringify(nodeInfo))
    );

    console.log(`Node announced to the network: ${node.peerId.toString()}`);
    console.log(`Listening on addresses: ${addresses.join(', ')}`);
}

/**
 * Finds peers in the network
 * @param {Object} node - The libp2p node
 * @param {number} limit - Maximum number of peers to find
 * @returns {Array} - Array of discovered peers
 */
export async function findPeers(node, limit = 10) {
    if (!node || !node.services.dht) {
        throw new Error('Node with DHT service is required');
    }

    const peers = [];

    try {
        // Query the DHT for nodes
        for await (const peer of node.services.dht.getClosestPeers(Buffer.from('shadspace'))) {
            peers.push(peer.toString());

            if (peers.length >= limit) {
                break;
            }
        }

        console.log(`Found ${peers.length} peers in the network`);
        return peers;
    } catch (err) {
        console.error('Error finding peers:', err);
        return [];
    }
}

/**
 * Looks up a specific node in the network
 * @param {Object} node - The libp2p node
 * @param {string} peerId - ID of the peer to look up
 * @returns {Object|null} - Node information if found
 */
export async function lookupNode(node, peerId) {
    if (!node || !node.services.dht) {
        throw new Error('Node with DHT service is required');
    }

    try {
        // Query the DHT for the node info
        const value = await node.services.dht.get(Buffer.from(`node:${peerId}`));
        if (!value) {
            return null;
        }

        return JSON.parse(new TextDecoder().decode(value));
    } catch (err) {
        console.error(`Error looking up node ${peerId}:`, err);
        return null;
    }
}