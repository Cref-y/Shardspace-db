/**
 * ShadSpace Web Interface - Client-side JavaScript
 */

// Keep track of connected state and node information
let isConnected = false;
let nodeInfo = null;
let peerId = null;
let apiEndpoint = 'http://localhost:3000'; // Your backend API endpoint

// Main initialization function
document.addEventListener('DOMContentLoaded', () => {
    initializeUI();
    setupEventListeners();
});

// Initialize UI elements
function initializeUI() {
    updateStatus('Disconnected');
    document.getElementById('connect-button').textContent = 'Connect';
    toggleFormElements(false);
    document.getElementById('node-info').innerHTML = '';
    document.getElementById('search-results').innerHTML = '';
    document.getElementById('file-info').textContent = 'No file selected';
}

// Set up event listeners for UI elements
function setupEventListeners() {
    // Connect button
    document.getElementById('connect-button').addEventListener('click', toggleConnection);

    // Upload form
    document.getElementById('upload-form').addEventListener('submit', async (event) => {
        event.preventDefault();
        await uploadFile();
    });

    // Search form
    document.getElementById('search-form').addEventListener('submit', async (event) => {
        event.preventDefault();
        await searchFile();
    });

    // File input for upload
    document.getElementById('file-input').addEventListener('change', (event) => {
        const fileInfo = document.getElementById('file-info');
        const file = event.target.files[0];

        if (file) {
            fileInfo.textContent = `Selected: ${file.name} (${formatFileSize(file.size)})`;
            document.getElementById('upload-button').disabled = false;
        } else {
            fileInfo.textContent = 'No file selected';
            document.getElementById('upload-button').disabled = true;
        }
    });
}

// Toggle connection state
async function toggleConnection() {
    const connectButton = document.getElementById('connect-button');

    if (!isConnected) {
        // Try to connect
        updateStatus('Connecting...');
        connectButton.disabled = true;

        try {
            // Connect to the node
            const response = await fetch(`${apiEndpoint}/connect`, {
                method: 'POST'
            });

            if (!response.ok) {
                throw new Error('Failed to connect to node');
            }

            const data = await response.json();
            peerId = data.peerId;

            isConnected = true;
            connectButton.textContent = 'Disconnect';
            updateStatus('Connected');
            toggleFormElements(true);

            // Get and display node info
            await loadNodeInfo();
        } catch (error) {
            updateStatus(`Connection failed: ${error.message}`);
            console.error('Connection error:', error);
        } finally {
            connectButton.disabled = false;
        }
    } else {
        // Disconnect
        updateStatus('Disconnecting...');
        connectButton.disabled = true;

        try {
            // Disconnect from the node
            await fetch(`${apiEndpoint}/disconnect`, {
                method: 'POST'
            });

            isConnected = false;
            peerId = null;
            connectButton.textContent = 'Connect';
            updateStatus('Disconnected');
            toggleFormElements(false);

            // Clear node info
            document.getElementById('node-info').innerHTML = '';
            document.getElementById('search-results').innerHTML = '';
        } catch (error) {
            updateStatus(`Disconnection failed: ${error.message}`);
            console.error('Disconnection error:', error);
        } finally {
            connectButton.disabled = false;
        }
    }
}

// Update connection status display
function updateStatus(message) {
    const statusElement = document.getElementById('connection-status');
    statusElement.textContent = message;
}

// Toggle form elements based on connection state
function toggleFormElements(enabled) {
    const forms = document.querySelectorAll('form:not(#connection-form)');
    forms.forEach(form => {
        const inputs = form.querySelectorAll('input, button');
        inputs.forEach(input => {
            input.disabled = !enabled;
        });
    });
}

// Load and display node information
async function loadNodeInfo() {
    try {
        const response = await fetch(`${apiEndpoint}/node-info`);
        if (!response.ok) {
            throw new Error('Failed to fetch node info');
        }

        nodeInfo = await response.json();
        displayNodeInfo(nodeInfo);
    } catch (error) {
        console.error('Error loading node info:', error);
        document.getElementById('node-info').innerHTML =
            `<p class="error">Error loading node information</p>`;
    }
}

// Display node information
function displayNodeInfo(info) {
    const nodeInfoElement = document.getElementById('node-info');

    nodeInfoElement.innerHTML = `
        <h3>Node Information</h3>
        <p><strong>Peer ID:</strong> ${info.peerId}</p>
        <p><strong>Addresses:</strong></p>
        <ul>
            ${info.addresses.map(addr => `<li>${addr}</li>`).join('')}
        </ul>
        <p><strong>Storage:</strong> ${formatFileSize(info.storageUsed)} / ${formatFileSize(info.storageCapacity)}</p>
        <p><strong>Connected Peers:</strong> ${info.peerCount}</p>
    `;
}

// Handle file upload
async function uploadFile() {
    const fileInput = document.getElementById('file-input');
    const file = fileInput.files[0];
    const uploadStatus = document.getElementById('upload-status');

    if (!file) {
        uploadStatus.textContent = 'Please select a file first';
        return;
    }

    uploadStatus.textContent = 'Uploading...';
    const uploadButton = document.getElementById('upload-button');
    uploadButton.disabled = true;

    try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${apiEndpoint}/upload`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(await response.text());
        }

        const result = await response.json();
        uploadStatus.innerHTML = `
            <strong>Upload successful!</strong><br>
            File ID: ${result.fileId}<br>
            Size: ${formatFileSize(result.size)}<br>
            Chunks: ${result.chunks}
        `;

        // Reset file input
        fileInput.value = '';
        document.getElementById('file-info').textContent = 'No file selected';
    } catch (error) {
        uploadStatus.textContent = `Upload failed: ${error.message}`;
        console.error('Upload error:', error);
    } finally {
        uploadButton.disabled = false;
    }
}

// Handle file search
async function searchFile() {
    const searchInput = document.getElementById('search-input');
    const query = searchInput.value.trim();
    const searchResults = document.getElementById('search-results');
    const searchStatus = document.getElementById('search-status');

    if (!query) {
        searchStatus.textContent = 'Please enter a search term';
        return;
    }

    searchStatus.textContent = 'Searching...';
    searchResults.innerHTML = '';

    try {
        const response = await fetch(`${apiEndpoint}/search?query=${encodeURIComponent(query)}`);
        if (!response.ok) {
            throw new Error('Search failed');
        }

        const results = await response.json();

        if (results.length === 0) {
            searchResults.innerHTML = '<p>No files found matching your query</p>';
            searchStatus.textContent = 'Search complete';
            return;
        }

        searchResults.innerHTML = `
            <h3>Search Results (${results.length})</h3>
            <div class="results-container">
                ${results.map(result => `
                    <div class="file-result">
                        <h4>${result.fileName}</h4>
                        <p>Size: ${formatFileSize(result.size)}</p>
                        <p>File ID: ${result.fileId}</p>
                        <p>Available on ${result.providers.length} nodes</p>
                        <button class="download-button" data-file-id="${result.fileId}">
                            Download
                        </button>
                    </div>
                `).join('')}
            </div>
        `;

        // Add event listeners to download buttons
        document.querySelectorAll('.download-button').forEach(button => {
            button.addEventListener('click', async () => {
                await downloadFile(button.dataset.fileId);
            });
        });

        searchStatus.textContent = 'Search complete';
    } catch (error) {
        searchStatus.textContent = `Search failed: ${error.message}`;
        console.error('Search error:', error);
    }
}

// Handle file download
async function downloadFile(fileId) {
    const downloadStatus = document.getElementById('download-status');
    downloadStatus.textContent = `Downloading file ${fileId}...`;

    try {
        const response = await fetch(`${apiEndpoint}/download/${fileId}`);
        if (!response.ok) {
            throw new Error('Download failed');
        }

        const blob = await response.blob();
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = `file-${fileId}`;

        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="?(.+?)"?$/);
            if (filenameMatch && filenameMatch[1]) {
                filename = filenameMatch[1];
            }
        }

        // Create download link and trigger click
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        downloadStatus.textContent = `Download complete: ${filename}`;
    } catch (error) {
        downloadStatus.textContent = `Download failed: ${error.message}`;
        console.error('Download error:', error);
    }
}

// Helper function to format file sizes
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}