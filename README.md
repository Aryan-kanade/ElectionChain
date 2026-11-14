🗳️ ElectionChain — Blockchain Based Secure Voting System
📌 Project Overview

ElectionChain is a secure, blockchain-powered digital voting platform designed to ensure transparency, integrity, and voter authentication in elections.
The system integrates OTP authentication, face verification, and blockchain recording to prevent fraud, duplicate voting, and unauthorized access.

The platform follows a modern MVC backend architecture with a lightweight frontend interface and a smart contract deployed on blockchain to guarantee tamper-proof vote storage.

## 📁 Project Structure

```
ElectionChain/
├── server.js               # Entry point — DB + blockchain init, HTTP server
├── app.js                  # Express app — security middleware, API routes,
│                           #   serves demo.html at the root in production
├── api.js                  # Frontend API client (auto-detects API base URL)
├── demo.html               # Voter interface (face-api + OTP + voting UI)
├── Election.sol            # Solidity voting contract
├── deploy.js               # Deploys the contract & writes contractABI.json
├── .env.example            # All configuration variables, documented
├── config/                 # database.js · blockchain.js · mailer.js
├── controllers/            # auth · vote · candidate · election · admin · audit · health
├── models/                 # Mongoose schemas (User, OTP, Candidate, AuditLog, …)
├── routes/                 # Express routers per domain
├── middleware/             # JWT auth · validation · error handling
├── services/               # Audit logging
├── utils/                  # Crypto helpers (hashing, OTP, face distance)
└── tests/                  # Jest + Supertest suite (44 tests)
```

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure
cp .env.example .env        # fill in MONGODB_URI + JWT_SECRET (see file comments)

# 3. Run
node server.js              # http://localhost:4000 — serves the voter UI at /

# Open http://localhost:4000 — the backend hosts the demo itself.
# Without SMTP configured, OTPs print to the server console (dev mode).
# Without a deployed contract, the app runs in DB-only mode (blockchain off).
```

Run the test suite:

```bash
npm test                    # 44 tests — auth, voting, candidates, middleware
```

## 🌍 Deployment

See **[DEPLOYMENT.md](DEPLOYMENT.md)** for the full guide (Render + MongoDB Atlas).
In short: the backend serves the frontend from the same origin, so a single
web service + a free MongoDB Atlas cluster is a complete production deployment.
Configure everything through environment variables — see `.env.example`.

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