/**
 * Initializes the DHT for the node (now done inside `createNode`).
 * @param {Object} node - The libp2p node instance.
 */
export async function setupDHT(node) {
    if (!node || !node.services.dht) {
        throw new Error('DHT service is not initialized. Ensure DHT is configured in createNode.');
    }
    console.log("DHT service is available.");
}

/* 
* Searches for a peer in the DHT using a specified peer ID.
* @param {Object} node - The libp2p node instance.
*/

export async function findPeer(node, peerId) {
    if (!node || !node.services.dht) {
        throw new Error('The DHT must be initialized before searching for peers.');
    }

    console.log(`Initiating search for peer: ${peerId}`);
    try {
        const peer = await node.services.dht.findPeer(peerId);
        console.log('Peer successfully found:', peer);
        return peer;
    } catch (error) {
        console.error('Error finding peer:', error);
        return null;
    }
}

/**
 * Stores a given value under a specified key within the DHT.
 */
export async function storeValue(node, key, value) {
    if (!node || !node.services.dht) {
        throw new Error('DHT service is not available.');
    }

    console.log(`Storing value in DHT, key: ${key}`);
    await node.services.dht.put(Buffer.from(key), Buffer.from(value));
    console.log("Value stored successfully.");
}

/**
 * Retrieves a value from the DHT using a specified key.
 */
export async function getValue(node, key) {
    if (!node || !node.services.dht) {
        throw new Error('DHT service is not available.');
    }

    console.log(`Retrieving value from DHT, key: ${key}`);
    try {
        const valueIterator = node.services.dht.get(Buffer.from(key));
        for await (const result of valueIterator) {
            const decodedValue = new TextDecoder().decode(result.value);
            console.log(`Retrieved value: ${decodedValue}`);
            return decodedValue;  // Return the first found value
        }

        console.log("No value found.");
        return null;
    } catch (error) {
        console.error("Failed to retrieve value:", error);
        return null;
    }
}

