#!/usr/bin/env node
/**
 * ShadSpace CLI - Command Line Interface for ShadSpace
 */
import { promises as fs } from 'fs';
import path from 'path';
import readline from 'readline';
import nodePromise from '../index.js';
import { uploadFile } from '../network/upload.js';
import { retrieveFile, locateFileByName } from '../network/retrieval.js';
import { findPeers } from '../network/discovery.js';
import { getStorageStats } from '../storage/local-storage.js';

// Create readline interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'shadspace> '
});

// Help message
const helpMessage = `
ShadSpace CLI Commands:
  help                          Show this help message
  upload <filepath> [--encrypt] Upload a file to the network
  download <fileId> [filepath]  Download a file from the network
  search <filename>             Search for a file by name
  peers                         List connected peers
  stats                         Show storage statistics
  exit                          Exit ShadSpace CLI
`;

// Main CLI function
async function startCLI() {
    console.log('Starting ShadSpace CLI...');

    // Wait for node to initialize
    const node = await nodePromise;
    console.log('Connected to ShadSpace node, ready for commands.');

    rl.prompt();

    rl.on('line', async (line) => {
        const args = line.trim().split(' ');
        const command = args[0].toLowerCase();

        try {
            switch (command) {
                case 'help':
                    console.log(helpMessage);
                    break;

                case 'upload':
                    if (args.length < 2) {
                        console.log('Usage: upload <filepath> [--encrypt]');
                        break;
                    }

                    const filePath = args[1];
                    const encrypt = args.includes('--encrypt');

                    try {
                        const fileData = await fs.readFile(filePath);
                        const fileName = path.basename(filePath);

                        console.log(`Uploading ${fileName} (${fileData.length} bytes), encrypt: ${encrypt}`);
                        const result = await uploadFile(node, fileData, fileName, { encrypt });

                        console.log('Upload complete:');
                        console.log(`  File ID: ${result.fileId}`);
                        console.log(`  Name: ${result.fileName}`);
                        console.log(`  Size: ${result.size} bytes`);
                        console.log(`  Chunks: ${result.chunks}`);
                        console.log(`  Encrypted: ${result.encrypted}`);
                        console.log(`  Root CID: ${result.rootCID}`);
                    } catch (err) {
                        console.error(`Upload failed: ${err.message}`);
                    }
                    break;

                case 'download':
                    if (args.length < 2) {
                        console.log('Usage: download <fileId> [filepath]');
                        break;
                    }

                    const fileId = args[1];
                    const outputPath = args[2] || './';

                    try {
                        console.log(`Downloading file ${fileId}...`);
                        const file = await retrieveFile(node, fileId);

                        let savePath;
                        if (outputPath.endsWith('/')) {
                            // It's a directory, use the original filename
                            await fs.mkdir(outputPath, { recursive: true });
                            savePath = path.join(outputPath, file.fileName);
                        } else {
                            // It's a specific file path
                            savePath = outputPath;
                        }

                        await fs.writeFile(savePath, file.data);
                        console.log(`File saved to ${savePath}`);
                    } catch (err) {
                        console.error(`Download failed: ${err.message}`);
                    }
                    break;

                case 'search':
                    if (args.length < 2) {
                        console.log('Usage: search <filename>');
                        break;
                    }

                    const fileName = args[1];
                    console.log(`Searching for file: ${fileName}`);

                    const results = await locateFileByName(node, fileName);

                    if (results.length === 0) {
                        console.log('No files found.');
                    } else {
                        console.log(`Found ${results.length} results:`);
                        results.forEach((result, i) => {
                            console.log(`  ${i + 1}. File ID: ${result.manifestId}`);
                            console.log(`     Provider: ${result.provider || 'Unknown'}`);
                        });
                    }
                    break;

                case 'peers':
                    console.log('Finding peers in the network...');
                    const peers = await findPeers(node, 20);

                    if (peers.length === 0) {
                        console.log('No peers found.');
                    } else {
                        console.log(`Found ${peers.length} peers:`);
                        peers.forEach((peer, i) => {
                            console.log(`  ${i + 1}. ${peer}`);
                        });
                    }
                    break;

                case 'stats':
                    const stats = await getStorageStats();
                    console.log('Storage Statistics:'); 
                    console.log(`  Node ID: ${stats.nodeId}`);
                    console.log(`  Total Chunks: ${stats.totalChunks}`);
                    console.log(`  Total Size: ${stats.totalSize} bytes`);
                    console.log(`  File Count: ${stats.fileCount}`);
                    console.log(`  Created At: ${stats.createdAt}`);
                    break;

                case 'exit':
                    console.log('Shutting down ShadSpace CLI...');
                    rl.close();
                    process.exit(0);
                    break;

                default:
                    if (command) {
                        console.log(`Unknown command: ${command}`);
                        console.log('Type "help" for available commands');
                    }
            }
        } catch (err) {
            console.error(`Error: ${err.message}`);
        }

        rl.prompt();
    });

    rl.on('close', () => {
        console.log('Goodbye!');
        process.exit(0);
    });
}

// Start the CLI
startCLI().catch(err => {
    console.error('CLI startup error:', err);
    process.exit(1);
});