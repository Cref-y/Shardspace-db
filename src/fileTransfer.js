import fs from 'fs';
import { encryptChunk, computeHash } from './encryption.js';
import { CHUNK_SIZE } from './config.js';

export function chunkAndEncryptFile(inputFilePath, outputDir) {
    const fileStream = fs.createReadStream(inputFilePath, { highWaterMark: CHUNK_SIZE });
    let chunkIndex = 0;

    fileStream.on('data', (chunk) => {
        const encryptedChunk = encryptChunk(chunk);
        const hash = computeHash(encryptedChunk);

        const outputFilePath = `${outputDir}/chunk_${chunkIndex}.enc`;
        fs.writeFileSync(outputFilePath, encryptedChunk);
        console.log(`Chunk ${chunkIndex} encrypted and saved: ${outputFilePath}, Hash: ${hash}`);

        chunkIndex++;
    });

    fileStream.on('end', () => console.log('File chunking and encryption completed.'));
}
