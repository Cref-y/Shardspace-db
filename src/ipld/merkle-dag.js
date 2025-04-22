/**
 * Implements Merkle-DAG structures for ShadSpace
 * Used for content-addressed linked data
 */
import { createCID } from './cid.js';

/**
 * Creates a Merkle-DAG node
 * @param {Object|Buffer|string} data - The data for this node
 * @param {Object} links - Map of name -> CID links to other nodes
 * @returns {Object} - DAG node object
 */
export function createNode(data, links = {}) {
    // Create a DAG node with data and links
    const node = {
        data,
        links: { ...links }
    };

    // Compute CID for the node
    const cid = createCID(node, 0x0200); // Use dag-json codec

    return {
        ...node,
        cid
    };
}

/**
 * Creates a file structure using a DAG
 * @param {Object} fileManifest - File manifest object
 * @param {Array} chunkCIDs - CIDs of the file chunks
 * @returns {Object} - Root DAG node representing the file
 */
export function createFileDAG(fileManifest, chunkCIDs) {
    // Create leaf nodes for each chunk
    const chunkNodes = chunkCIDs.map((cid, index) => {
        return createNode({
            type: 'chunk',
            index,
            size: fileManifest.chunks[index].size
        }, { data: cid });
    });

    // Create chunk links
    const chunkLinks = {};
    chunkNodes.forEach((node, index) => {
        chunkLinks[`chunk${index}`] = node.cid;
    });

    // Create root file node
    const rootNode = createNode({
        type: 'file',
        name: fileManifest.fileName,
        size: fileManifest.size,
        created: fileManifest.created,
        chunkCount: chunkNodes.length
    }, chunkLinks);

    return rootNode;
}

/**
 * Creates a directory DAG node
 * @param {string} name - Directory name
 * @param {Object} entries - Map of entry name -> CID
 * @returns {Object} - Directory DAG node
 */
export function createDirectoryNode(name, entries = {}) {
    return createNode({
        type: 'directory',
        name,
        entryCount: Object.keys(entries).length
    }, entries);
}

/**
 * Serializes a DAG node to a JSON string
 * @param {Object} node - DAG node
 * @returns {string} - JSON string
 */
export function serializeNode(node) {
    return JSON.stringify(node);
}

/**
 * Deserializes a JSON string to a DAG node
 * @param {string} json - JSON string
 * @returns {Object} - DAG node
 */
export function deserializeNode(json) {
    return JSON.parse(json);
}