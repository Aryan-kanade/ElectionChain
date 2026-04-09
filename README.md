# ElectionChain
ElectionChain is a blockchain-based secure voting system built using Node.js, MongoDB, and Web3. It ensures transparent, tamper-proof elections by storing votes as cryptographically hashed blocks while keeping voter identities private through authentication and hashing mechanisms.
🗳️ ElectionChain — Blockchain Based Secure Voting System
📌 Project Overview

ElectionChain is a secure, blockchain-powered digital voting platform designed to ensure transparency, integrity, and voter authentication in elections.
The system integrates OTP authentication, face verification, and blockchain recording to prevent fraud, duplicate voting, and unauthorized access.

The platform follows a modern MVC backend architecture with a lightweight frontend interface and a smart contract deployed on blockchain to guarantee tamper-proof vote storage.

🏗️ System Architecture
Browser (Frontend)
│
├── demo.html (Voter Interface)
├── admin-dashboard.html (Admin Panel)
│
▼
Node.js Backend (MVC Architecture)
│
├── Routes → API endpoints
├── Controllers → Business logic
├── Models → Database schemas
├── Middleware → Auth & validation
├── Services → Logging & utilities
│
▼
Database + Blockchain
│
├── MongoDB Atlas → Users, Candidates, Logs
└── Ethereum / Polygon → Immutable vote records

The architecture separates responsibilities across layers, making the system scalable, maintainable, and testable.

⚙️ Core Features
1️⃣ Secure User Authentication
Email-based OTP verification
JWT-based login authentication
Face recognition verification before voting

This multi-layer authentication ensures only verified voters can cast votes.

2️⃣ Blockchain Vote Recording

Votes are stored on a smart contract, ensuring:

Tamper-proof vote storage
Transparent vote counting
Immutable election records

Each vote transaction is permanently recorded on the blockchain.

3️⃣ Double Voting Prevention

The system prevents duplicate voting using:

MongoDB atomic update queries
hasVoted flag validation
Blockchain transaction verification

This ensures one voter = one vote.

4️⃣ Admin Dashboard

Administrators can:

Add election candidates
Set election start and end time
Monitor vote counts
Propose election results
Review admin activity logs

The dashboard provides visual analytics using charts.

5️⃣ Audit Logging System

Every critical activity is logged:

User login
Vote casting
Candidate creation
Admin actions

This improves transparency and accountability.

🧱 Backend Architecture (MVC)
Models

Defines database schemas using Mongoose

Examples:

User
Candidate
OTP
AuditLog
AdminLog
ElectionConfig
Controllers

Contains business logic for each domain:

Controller	Responsibility
Auth Controller	OTP, login, registration
Vote Controller	Vote casting
Candidate Controller	Candidate management
Election Controller	Election timing
Admin Controller	Result approval
Audit Controller	Logs & user profile
Health Controller	System health check
Routes

Maps URLs to controllers.

Example:

POST /api/auth/register
POST /api/auth/login
POST /api/vote
GET  /api/candidates
Middleware

Handles cross-cutting logic:

JWT verification
Role-based access control
Input validation
Global error handling
🔐 Security Measures
Threat	Protection
XSS attacks	Helmet security headers
NoSQL injection	Mongo sanitize
Parameter pollution	HPP middleware
Brute-force attacks	Rate limiting
Double voting	Atomic MongoDB update
Token tampering	JWT signature validation
Face spoofing	Descriptor comparison
🧪 Testing

The backend includes 41 automated tests using:

Jest
Supertest
mongodb-memory-server

Test coverage includes:

Authentication
Voting logic
Candidate APIs
Middleware validation
🛠️ Technology Stack
Frontend
HTML5
CSS3
JavaScript
face-api.js
Chart.js
Backend
Node.js
Express.js
MVC architecture
Database
MongoDB Atlas
Mongoose ORM
Blockchain
Solidity Smart Contract
Web3.js
Polygon Amoy Testnet
Security
Helmet
express-rate-limit
express-mongo-sanitize
HPP
Testing
Jest
Supertest
⚠️ Known Limitations
Face recognition is not production-grade
Photo spoofing may still be possible.
Server signs blockchain transactions
True decentralization would require MetaMask voting.
Votes are not fully anonymous
Audit logs store voter hash.
Rate limiting is single-instance
Production requires Redis.
🚀 Future Improvements
MetaMask based voting
Zero-knowledge proofs for anonymous voting
Biometric liveness detection
Mobile application
Multi-region deployment
📊 Project Highlights

✔ Blockchain-based vote storage
✔ OTP + Face verification security
✔ MVC scalable backend architecture
✔ Admin analytics dashboard
✔ 41 automated backend tests

🎓 Conclusion

ElectionChain demonstrates how blockchain, biometrics, and modern backend architecture can be combined to create a secure and transparent digital voting system.

The project showcases real-world concepts including:

distributed ledgers
authentication systems
secure API design
scalable backend architecture

making it a strong example of modern secure web application development.
