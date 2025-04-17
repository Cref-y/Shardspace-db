import { noise } from '@chainsafe/libp2p-noise';
import { yamux } from '@chainsafe/libp2p-yamux';
import { mdns } from '@libp2p/mdns';
import { tcp } from '@libp2p/tcp';
import { webSockets } from '@libp2p/websockets';
import { kadDHT } from '@libp2p/kad-dht';
import { identify } from '@libp2p/identify'; 
import defaultsDeep from '@nodeutils/defaults-deep';
import { createLibp2p as create } from 'libp2p';
import { bootstrap } from '@libp2p/bootstrap';

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
        connectionEncrypters: [
            noise()
        ],
        peerDiscovery: [  // ✅ Move peer discovery here
            mdns(),
            bootstrap({
                list: [  // List of known bootstrap peers
                    '/ip4/127.0.0.1/tcp/4001/p2p/QmSomeHash'
                ]
            })
        ],
        services: {
            identify: identify(),  
            dht: kadDHT({  // ✅ Keep DHT as a service
                protocol: '/ipfs/kad/1.0.0',
                clientMode: false
            })
        }
    };

    const node = await create(defaultsDeep(_options, defaults));
    console.log(`Libp2p node started with Peer ID: ${node.peerId.toString()}`);
    await node.start();
    return node;
}
