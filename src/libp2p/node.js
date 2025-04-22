import { noise } from '@chainsafe/libp2p-noise';
import { yamux } from '@chainsafe/libp2p-yamux';
import { mdns } from '@libp2p/mdns';
import { tcp } from '@libp2p/tcp';
import { webSockets } from '@libp2p/websockets';
import { kadDHT } from '@libp2p/kad-dht';
import { identify } from '@libp2p/identify';
import { gossipsub } from '@chainsafe/libp2p-gossipsub';
import { bootstrap } from '@libp2p/bootstrap';
import { createLibp2p } from 'libp2p';
import defaultsDeep from '@nodeutils/defaults-deep';

export async function createNode(_options = {}) {
    const defaults = {
        addresses: {
            listen: ['/ip4/0.0.0.0/tcp/0', '/ip4/127.0.0.1/tcp/0/ws']
        },
        transports: [
            tcp(),
            webSockets()
        ],
        streamMuxers: [
            yamux()
        ],
        connectionEncryption: [ // Changed from connectionEncrypters
            noise()
        ],
        peerDiscovery: [
            mdns({
                interval: 10000,
                broadcast: true,
                compat: false
            }),
            bootstrap({
                list: [
                    '/ip4/104.131.131.82/tcp/4001/p2p/QmaCpDMGvV2BGHeYERUEnRQAwe3N8SzbUtfsmvsqQLuvuJ',
                    '/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN'
                ],
                interval: 10000,
                timeout: 1000 // Add timeout
            })
        ],
        services: {
            identify: identify(),
            pubsub: gossipsub({
                emitSelf: false,
                fallbackToFloodsub: true
            }),
            dht: kadDHT({
                protocol: '/ipfs/kad/1.0.0',
                clientMode: false
            })
        }
    };

    const node = await createLibp2p(defaultsDeep(_options, defaults));
    console.log(`Libp2p node started with Peer ID: ${node.peerId.toString()}`);
    await node.start();
    return node;
}