import { mdns } from "@libp2p/mdns";
import { bootstrap } from '@libp2p/bootstrap';

/**
 * Initializes peer discovery services.
 * @param {Object} node - The libp2p node instance.
 */
export async function setupDiscovery(node) {
    if (!node) throw new Error('Node is required to setup peer discovery.');

    console.log('🔍 Setting up peer discovery...');

    // Event listener for the 'peer:discovery' event
    node.addEventListener('peer:discovery', async (evt) => {
        const peerId = evt.detail.id.toString();
        console.log(`👀 Discovered peer: ${peerId}`);

        try {
            console.log(`🔗 Attempting to dial ${peerId}...`);
            await node.dial(evt.detail);
            console.log(`✅ Successfully connected to ${peerId}`);
        } catch (err) {
            console.error(`❌ Failed to connect to ${peerId}:`, err);
        }
    });

    console.log('✅ Peer discovery setup complete.');
}

/**
 * Adds bootstrap nodes to assist in discovery.
 * @param {Object} node - The libp2p node instance.
 * @param {Array<string>} bootstrapPeers - Array of bootstrap peer addresses.
 */
export async function addBootstrapPeers(node, bootstrapPeers = []) {
    if (!node) throw new Error('Node is required to add bootstrap peers.');

    if (bootstrapPeers.length === 0) {
        console.log('⚠️ No bootstrap peers provided.');
        return;
    }

    console.log('🚀 Adding bootstrap peers...');

    if (!node.services.bootstrap) {
        throw new Error('❌ Bootstrap service is not available.');
    }

    // Manually connect to bootstrap peers
    for (const peer of bootstrapPeers) {
        try {
            console.log(`🔗 Connecting to bootstrap peer: ${peer}`);
            await node.dial(peer);
            console.log(`✅ Connected to ${peer}`);
        } catch (err) {
            console.error(`❌ Failed to connect to bootstrap peer ${peer}:`, err);
        }
    }

    console.log('✅ Bootstrap peers added successfully.');
}
