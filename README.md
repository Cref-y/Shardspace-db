# 🚀 Decentralized Storage System

## Overview
The Decentralized Storage System is a peer-to-peer (P2P) file storage network built using **libp2p**, **Ethereum smart contracts**, and **AES-256 encryption**. It ensures secure, distributed, and incentivized data storage using blockchain-based rewards.

## 🌟 Features
- **P2P Networking:** Uses libp2p for peer discovery and direct communication.
- **Secure Storage:** Files are chunked, encrypted, and distributed across multiple nodes.
- **Blockchain Integration:** Smart contracts on Ethereum store metadata and reward storage providers.
- **Token Incentives:** Users earn DecentraStoreToken (DST) for providing storage.
- **Reliability & Redundancy:** Implements chunk replication and uptime monitoring.
- **User-Friendly UI:** Web and mobile apps for easy file management.

---

## 📍 Roadmap

### 🟢 Phase 1: Core Infrastructure Setup
1️⃣ **libp2p P2P Network Setup**
- Research libp2p networking and peer discovery
- Set up a basic P2P network with libp2p in Node.js
- Implement peer-to-peer connections using WebSockets / WebRTC
- Test peer discovery, messaging, and connectivity

### 🟡 Phase 2: Data Storage & Encryption
2️⃣ **Chunking & Encryption**
- Implement file chunking (split large files into 1MB pieces)
- Encrypt each chunk using AES-256
- Generate SHA-256 hashes for integrity verification
- Store chunk metadata in NoSQL (MongoDB/CouchDB)

3️⃣ **Decentralized Hash Table (DHT) for Chunk Lookup**
- Implement a DHT-based indexing system using libp2p
- Store chunk locations (which peer has which chunk)
- Implement retrieval logic using DHT queries

### 🔵 Phase 3: Ethereum Smart Contracts for Metadata & Incentives
4️⃣ **Smart Contract for File Storage Tracking**
- Write a Solidity smart contract to store chunk hashes + node mappings
- Implement Proof-of-Storage for rewarding nodes
- Deploy contract on Ethereum Testnet (Goerli/Sepolia)
- Integrate Web3.js for interaction between Node.js and Ethereum

5️⃣ **Implement Token Incentive Model**
- Design a simple ERC-20 token (DecentraStoreToken - DST)
- Reward users for storing and correctly retrieving data
- Implement a penalty system for offline nodes

### 🟠 Phase 4: File Retrieval & Node Reliability
6️⃣ **Data Retrieval & Integrity Checking**
- Develop retrieval logic (query DHT for chunk locations)
- Fetch encrypted chunks from multiple nodes
- Validate chunk integrity with SHA-256
- Reconstruct files using Reed-Solomon erasure coding
- Decrypt and serve the file to users

7️⃣ **Handling Node Failures & Redundancy**
- Implement chunk replication (store multiple copies)
- Monitor node uptime and redistribute data if a node leaves
- Periodically verify data availability

### 🟣 Phase 5: API & UI Development
8️⃣ **Backend API (Node.js + Express/FastAPI)**
- Create an API for uploading, retrieving, and checking files
- Integrate with libp2p for file storage
- Connect to Ethereum smart contract for tracking

9️⃣ **Frontend UI (React / React Native for Mobile)**
- Develop a simple web/mobile UI to upload/download files
- Show storage usage, rewards, and file history
- Enable users to manage their storage participation

### 🟤 Phase 6: Optimization & Deployment
🔟 **Optimization & Security Enhancements**
- Optimize libp2p performance (reduce latency, improve discovery)
- Implement SSL/TLS encryption for secure communication
- Add a user authentication system

1️⃣1️⃣ **Deploy & Test on a Global Network**
- Deploy smart contract to Ethereum Mainnet
- Launch a public node network (users can join & contribute storage)
- Conduct stress testing & bug fixes

---

## 🔥 Final Deliverables
✅ Fully decentralized storage network using libp2p + Ethereum  
✅ Encrypted file storage and retrieval system  
✅ Blockchain-based smart contract for metadata & incentives  
✅ Web/Mobile UI for users to interact with storage  
✅ Token reward system for nodes providing storage  

---

## 🚀 Getting Started

### Prerequisites
Ensure you have the following installed:
- **Node.js** (>=16.x)
- **MongoDB or CouchDB**
- **Ethereum Wallet (MetaMask)**
- **Web3.js & Solidity Compiler**

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/your-repo/decentralized-storage.git
   cd decentralized-storage
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the libp2p node:
   ```bash
   node src/p2p.js
   ```
4. Deploy the smart contract:
   ```bash
   npx hardhat run scripts/deploy.js --network goerli
   ```
5. Run the backend API:
   ```bash
   node src/api.js
   ```
6. Start the frontend UI:
   ```bash
   cd frontend
   npm start
   ```

---

## 📜 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🤝 Contributing
Pull requests are welcome! Please follow the contribution guidelines.

---

## 📩 Contact
For support or inquiries, reach out at **jimlestonosoi42@gmail.com**.