import { createNode } from "./libp2p/node.js";
import { setupDHT, findPeer, storeValue, getValue } from "./libp2p/dht.js";

(async () => {
    const node = await createNode({
        addresses: {
            listen: ['/ip4/0.0.0.0/tcp/0']
        }
    });
    
    console.log(`Libp2p node started with Peer ID: ${node.peerId.toString()}`);
    node.addEventListener('peer:discovery', (evt) => {
        console.info('peer:discovery', evt.detail)
    });
    
    await setupDHT(node);  // No need to start DHT separately

    await storeValue(node, 'myKey', 'Hello, DHT!');
    const value = await getValue(node, 'myKey');
    console.log(value);
})();
