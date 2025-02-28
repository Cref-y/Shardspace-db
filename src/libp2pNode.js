import { createLibp2p } from 'libp2p';
import { tcp } from '@libp2p/tcp';
import { webSockets } from '@libp2p/websockets';
import { noise } from '@chainsafe/libp2p-noise';
import { mplex } from '@libp2p/mplex';
import { kadDHT } from '@libp2p/kad-dht';
import { mdns } from '@libp2p/mdns';
import { gossipsub } from '@chainsafe/libp2p-gossipsub';
import { identify } from '@libp2p/identify'; // ✅ Add identify service

const TOPIC = 'global-chat';

export async function createNode() {
    const node = await createLibp2p({
        addresses: { listen: ['/ip4/0.0.0.0/tcp/0'] },
        transports: [tcp(), webSockets()],
        connectionEncryption: [noise()],
        streamMuxers: [mplex()],
        dht: kadDHT(),
        peerDiscovery: [mdns({ interval: 2000 })],
        services: {
            pubsub: gossipsub(),
            identify: identify()  // ✅ Add the identify service
        }
    });

    await node.start();
    console.log(`🚀 Node started! Peer ID: ${node.peerId.toString()}`);

    node.addEventListener('peer:discovery', (event) => {
        console.log(`👀 Discovered peer: ${event.detail.id.toString()}`);
    });

    node.services.pubsub.subscribe(TOPIC); // ✅ Updated to use `services.pubsub`
    
    node.services.pubsub.addEventListener('message', (event) => {
        const message = new TextDecoder().decode(event.detail.data);
        console.log(`📩 Received message: "${message}" from ${event.detail.from}`);
    });

    return node;
}

// Function to broadcast a message
export async function broadcastMessage(node, message) {
    if (!node.services.pubsub) {
        console.error('PubSub is not enabled on this node');
        return;
    }
    await node.services.pubsub.publish(TOPIC, new TextEncoder().encode(message));
    console.log(`📢 Broadcasted message: "${message}"`);
}
