# ElectionChain
🗳️ ElectionChain — Blockchain Based Secure Voting System
📌 Project Overview

ElectionChain is a secure blockchain-based digital voting platform designed to ensure transparency, integrity, and voter authentication in elections.

The system integrates multiple security layers including OTP authentication, face verification, backend validation, and blockchain recording to prevent fraud, duplicate voting, and unauthorized access.

Votes are recorded as blockchain transactions using smart contract logic, making election records tamper-proof, transparent, and verifiable.

The project follows a modern MVC backend architecture with a lightweight frontend interface and a blockchain layer that guarantees immutable vote storage.

🏗️ System Architecture

The application follows a layered architecture where responsibilities are separated between frontend, backend services, database, and blockchain.

Browser (Frontend)
│
├── demo.html                → Voter interface
├── admin-dashboard.html     → Admin control panel
│
▼
Node.js Backend (MVC Architecture)
│
├── Routes       → API endpoints
├── Controllers  → Business logic
├── Models       → Database schemas
├── Middleware   → Authentication & validation
├── Services     → Logging & utilities
│
▼
Data Storage Layer
│
├── MongoDB Atlas         → Users, Candidates, Logs
└── Blockchain Network    → Immutable vote records

This architecture ensures the system is scalable, maintainable, and testable.

⚙️ Core Features
1️⃣ Secure User Authentication

The system ensures that only verified voters can participate through multi-layer authentication:

Email-based OTP verification
JWT-based login authentication
Face recognition verification before voting

This layered approach prevents unauthorized access and fake voters.

2️⃣ Blockchain Vote Recording

Votes are recorded through blockchain transactions using a smart contract.

Benefits:

Tamper-proof vote storage
Transparent vote counting
Immutable election records

Each vote becomes a permanent blockchain record.

The blockchain integration uses Web3.js to interact with smart contracts inspired by networks such as Bitcoin.

Cryptographic hashing is performed using SHA-256.

3️⃣ Double Voting Prevention

The system ensures one voter = one vote using multiple validation layers:

MongoDB atomic update queries
hasVoted flag validation
Blockchain transaction verification

This prevents duplicate voting attempts.

4️⃣ Admin Dashboard

Administrators manage the election through a dedicated dashboard.

Admin capabilities include:

Add election candidates
Set election start and end times
Monitor vote counts
Propose election results
Review admin activity logs

The dashboard provides visual analytics using charts.

5️⃣ Audit Logging System

To improve transparency, all important actions are recorded.

Logged events include:

User login
Vote casting
Candidate creation
Admin actions

This creates a traceable activity history.

🧱 Backend Architecture (MVC)

The backend is organized using the Model-View-Controller (MVC) pattern.

Models

Models define database schemas using Mongoose.

Examples:

User
Candidate
OTP
Vote
AuditLog
AdminLog
ElectionConfig
Controllers

Controllers contain business logic for each domain.

Controller	Responsibility
Auth Controller	OTP verification, login, registration
Vote Controller	Vote casting and validation
Candidate Controller	Candidate management
Election Controller	Election timing control
Admin Controller	Result approval
Audit Controller	Logs and user profile
Health Controller	System health check
Routes

Routes connect frontend requests to backend controllers.

Example endpoints:

POST /api/auth/register
POST /api/auth/login
POST /api/vote
GET /api/candidates
Middleware

Middleware handles cross-cutting logic such as security and validation.

Examples:

JWT verification
Role-based access control
Input validation
Global error handling
🔐 Security Measures

The system implements several security protections.

Threat	Protection
XSS attacks	Helmet security headers
NoSQL injection	Mongo sanitize
Parameter pollution	HPP middleware
Brute-force attacks	Rate limiting
Double voting	Atomic MongoDB updates
Token tampering	JWT signature validation
Face spoofing	Descriptor comparison

These protections strengthen backend security.

🧪 Testing

The backend includes 41 automated tests.

Testing tools used:

Jest
Supertest
mongodb-memory-server

Test coverage includes:

Authentication
Voting logic
Candidate APIs
Middleware validation
🛠 Technology Stack
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
Solidity smart contract
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

Some limitations remain due to the prototype nature of the system.

Face recognition is not production-grade.
Photo spoofing may still be possible.
Server signs blockchain transactions.
True decentralization would require MetaMask voting.
Votes are not fully anonymous.
Audit logs store voter hash.
Rate limiting is single-instance.
Production environments would require Redis.
🚀 Future Improvements

Possible future upgrades include:

MetaMask-based voting
Zero-knowledge proofs for anonymous voting
Biometric liveness detection
Mobile application
Multi-region deployment
📊 Project Highlights

✔ Blockchain-based vote storage
✔ OTP + face verification security
✔ MVC scalable backend architecture
✔ Admin analytics dashboard
✔ 41 automated backend tests

🎓 Conclusion

ElectionChain demonstrates how blockchain technology, biometric verification, and secure backend architecture can be combined to build a transparent digital voting system.

The project highlights real-world concepts including:

distributed ledger technology
authentication systems
secure API design
scalable backend architecture

This makes ElectionChain a strong example of modern secure web application development.
