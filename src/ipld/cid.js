/**
 * Implementation of Content Identifiers (CIDs) for ShadSpace
 * Based on IPFS/IPLD CID concept
 */
import { createHash } from 'crypto';
import { base58btc } from 'multiformats/bases/base58';

// CID version and codec types
const CID_VERSION = 1;
const CODEC_RAW = 0x55; // raw binary
const CODEC_JSON = 0x0200; // dag-json

/**
 * Creates a CID from data
 * @param {Buffer|string|Object} data - The data to hash
 * @param {number} codec - The codec code (default: raw)
 * @returns {string} - Base58 encoded CID string
 */
export function createCID(data, codec = CODEC_RAW) {
    let buffer;

    if (Buffer.isBuffer(data)) {
        buffer = data;
    } else if (typeof data === 'string') {
        buffer = Buffer.from(data);
    } else if (typeof data === 'object') {
        buffer = Buffer.from(JSON.stringify(data));
        codec = CODEC_JSON; // Use JSON codec for objects
    } else {
        throw new Error('Unsupported data type for CID creation');
    }

    // Create multihash using SHA-256
    const hash = createHash('sha256').update(buffer).digest();

    // Encode the multicodec and multihash into a CID
    // This is a simplified version of the actual CID format
    const cidBuffer = Buffer.concat([
        Buffer.from([CID_VERSION]),
        Buffer.from([codec >> 8, codec & 0xff]), // Codec as 2 bytes
        hash
    ]);

    // Encode the CID buffer to Base58
    return base58btc.encode(cidBuffer);
}

/**
 * Parses a CID string into its components
 * @param {string} cidString - Base58 encoded CID
 * @returns {Object} - CID components
 */
export function parseCID(cidString) {
    const cidBuffer = base58btc.decode(cidString);

    const version = cidBuffer[0];
    const codec = (cidBuffer[1] << 8) + cidBuffer[2];
    const hash = cidBuffer.slice(3);

    return {
        version,
        codec,
        codecName: getCodecName(codec),
        multihash: hash,
        toString: () => cidString
    };
}

/**
 * Gets human-readable name for a codec code
 * @param {number} codec - Codec code
 * @returns {string} - Codec name
 */
function getCodecName(codec) {
    switch (codec) {
        case CODEC_RAW:
            return 'raw';
        case CODEC_JSON:
            return 'dag-json';
        default:
            return `unknown(${codec})`;
    }
}

/**
 * Checks if two CIDs are the same
 * @param {string} cid1 - First CID string
 * @param {string} cid2 - Second CID string
 * @returns {boolean} - True if CIDs are equal
 */
export function isCIDEqual(cid1, cid2) {
    return cid1 === cid2;
}