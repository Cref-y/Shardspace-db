import fs from 'fs';
import { createNode } from './libp2pNode.js';

async function receiveFile() {
    const node = await createNode();

    node.handle('/file-transfer', async ({ stream }) => {
        const fileStream = fs.createWriteStream('files/received/file_received.txt');

        for await (const chunk of stream) {
            fileStream.write(chunk);
        }

        fileStream.end();
        console.log('📥 File received successfully.');
    });
    
}

receiveFile();
