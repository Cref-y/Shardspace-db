import { createLibp2p } from 'libp2p';
import { webSockets } from '@libp2p/websockets';
import { noise } from '@libp2p/noise';
import { gossipsub } from '@chainsafe/libp2p-gossipsub';
import { kadDHT } from '@libp2p/kad-dht';
import { multiaddr } from '@multiformats/multiaddr';

/**
 * Initializes PubSub messaging for decentralized communication.
 */
export async function createNode() {
    const node = await createLibp2p({
        transports: [webSockets()],
        connectionEncryption: [noise()],
        pubsub: gossipsub(),
        dht: kadDHT(),
    });

    await node.start();
    console.log(`Libp2p node started with Peer ID: ${node.peerId.toString()}`);
    return node;
}

/**
 * Subscribes to a PubSub topic and handles incoming messages.
 */
export async function subscribeToTopic(node, topic, messageHandler) {
    if (!node) throw new Error('Node is required');
    if (!node.services.pubsub) {
        throw new Error('PubSub is not enabled. Ensure gossipsub is configured in createNode');
    }

    try {
        node.services.pubsub.subscribe(topic);
        node.services.pubsub.addEventListener('message', (evt) => {
            if (evt.detail.topic === topic) {
                try {
                    const message = new TextDecoder().decode(evt.detail.data);
                    messageHandler(message);
                } catch (err) {
                    console.error(`Error processing message on ${topic}:`, err);
                }
            }
        });
        console.log(`Subscribed to topic: ${topic}`);
    } catch (err) {
        console.error(`Failed to subscribe to ${topic}:`, err);
        throw err;
    }
}


/**
 * Publishes a message to a PubSub topic.
 */
export async function publishMessage(node, topic, message) {
    if (!node.pubsub) {
        throw new Error('PubSub is not enabled on this node.');
    }

    const encodedMessage = new TextEncoder().encode(message);
    await node.pubsub.publish(topic, encodedMessage);
    console.log(`Published message to ${topic}:`, message);
}
