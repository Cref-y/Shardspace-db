import { createNode } from "./libp2p/node.js";
import { setupDiscovery, addBootstrapPeers } from "./network/discovery.js";
import { setupDHT, findPeer, storeValue, getValue } from "./libp2p/dht.js";

console.clear();
console.log(`
███████╗██╗  ██╗ █████╗ ██████╗ ███████╗███████╗███████╗
██╔════╝██║  ██║██╔══██╗██╔══██╗██╔════╝██╔════╝██╔════╝
███████╗███████║███████║██████╔╝█████╗  █████╗  █████╗  
╚════██║██╔══██║██╔══██║██╔═══╝ ██╔══╝  ██╔══╝  ██╔══╝  
███████║██║  ██║██║  ██║██║     ███████╗███████╗███████╗
╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚══════╝╚══════╝╚══════╝
=========================================================
🔥 Welcome to ShadSpace - A Decentralized Storage System 🔥
=========================================================
`);

(async () => {
    const node = await createNode({}); 
    await setupDiscovery(node);
    await addBootstrapPeers(node, ['/ip4/127.0.0.1/tcp/4001/p2p/QmSomeHash']);
    await setupDHT(node);  // No need to start DHT separately
})();
