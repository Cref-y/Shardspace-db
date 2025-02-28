import fs from 'fs';
import { createNode, broadcastMessage } from './libp2pNode.js';
import { multiaddr } from 'multiaddr';

async function waitForPeers(node, timeout = 5000) {
    return new Promise((resolve) => {
        const discoveredPeers = new Map();

        node.addEventListener('peer:discovery', (event) => {
            const peerId = event.detail.id.toString();
            const addresses = event.detail.multiaddrs ? event.detail.multiaddrs.map((addr) => addr.toString()) : [];
        
            if (addresses.length > 0) {
                discoveredPeers.set(peerId, addresses);
            } else {
                console.log(`⚠️ No valid addresses found for peer: ${peerId}`);
            }
        });
        

        setTimeout(() => {
            resolve(discoveredPeers);
        }, timeout);
    });
}

async function broadcastFile(filePath) {
    try {
        const node = await createNode();

        const peerMap = await waitForPeers(node);
        console.log('👥 Discovered peers:', peerMap);

        for (const [peerId, addresses] of peerMap.entries()) {
            for (const addr of addresses) {
                try {
                    console.log(`🔗 Connecting to peer ${peerId} at ${addr}...`);
                    await node.dial(multiaddr(addr)); // Manually connect
                } catch (error) {
                    console.warn(`⚠️ Failed to connect to ${peerId}: ${error.message}`);
                }
            }
        }

        console.log('⏳ Waiting for peers to subscribe...');
        await new Promise((resolve) => setTimeout(resolve, 5000));

        await broadcastMessage(node, "Hello, P2P World!");
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        process.exit(1);
    }
}

broadcastFile('files/toSend/sample.txt');
