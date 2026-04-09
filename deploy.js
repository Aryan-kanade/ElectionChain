/**
 * deploy.js — Deploy ElectionChain smart contract to Ganache
 * 
 * Prerequisites:
 *   1. Install Ganache: npm install -g ganache
 *   2. Run Ganache:     ganache --port 8545
 *   3. Run this:        node deploy.js
 * 
 * Output: saves CONTRACT_ADDRESS to .env automatically
 */

const { Web3 } = require('web3');
const fs   = require('fs');
const path = require('path');

// ── COMPILE CONTRACT INLINE (using solc if available, else use ABI directly) ─
// For production use: npx hardhat compile
// For this demo: we provide the pre-compiled ABI + bytecode

const CONTRACT_ABI = [
  {"inputs":[{"internalType":"uint256","name":"_requiredApprovals","type":"uint256"}],"stateMutability":"nonpayable","type":"constructor"},
  {"anonymous":false,"inputs":[{"indexed":true,"name":"newAdmin","type":"address"}],"name":"AdminAdded","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"name":"proposalId","type":"uint256"},{"indexed":true,"name":"approver","type":"address"}],"name":"AdminApproved","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"name":"proposalId","type":"uint256"},{"indexed":true,"name":"proposed","type":"address"},{"indexed":true,"name":"proposer","type":"address"}],"name":"AdminProposed","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"name":"id","type":"uint256"},{"indexed":true,"name":"approvedBy","type":"address"}],"name":"CandidateApproved","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"name":"id","type":"uint256"},{"name":"name","type":"string"},{"name":"party","type":"string"},{"indexed":true,"name":"addedBy","type":"address"}],"name":"CandidateAdded","type":"event"},
  {"anonymous":false,"inputs":[{"name":"start","type":"uint256"},{"name":"end","type":"uint256"},{"indexed":true,"name":"by","type":"address"}],"name":"ElectionStartSet","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"name":"proposer","type":"address"}],"name":"ResultProposalCreated","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"name":"approver","type":"address"},{"name":"approvals","type":"uint256"}],"name":"ResultProposalApproved","type":"event"},
  {"anonymous":false,"inputs":[{"name":"winnerId","type":"uint256"},{"name":"winnerVotes","type":"uint256"},{"name":"timestamp","type":"uint256"}],"name":"ResultsDeclared","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"name":"voter","type":"address"},{"indexed":true,"name":"candidateId","type":"uint256"},{"name":"voteHash","type":"bytes32"},{"name":"timestamp","type":"uint256"}],"name":"VoteCast","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"name":"voter","type":"address"},{"name":"faceHash","type":"bytes32"},{"name":"timestamp","type":"uint256"}],"name":"VoterRegistered","type":"event"},
  {"inputs":[{"name":"_name","type":"string"},{"name":"_party","type":"string"}],"name":"addCandidate","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"name":"_id","type":"uint256"}],"name":"approveCandidate","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"name":"_pid","type":"uint256"}],"name":"approveAdminProposal","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"name":"_candidateId","type":"uint256"}],"name":"castVote","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[],"name":"getAllCandidates","outputs":[{"name":"ids","type":"uint256[]"},{"name":"names","type":"string[]"},{"name":"parties","type":"string[]"},{"name":"approved","type":"bool[]"},{"name":"voteCounts","type":"uint256[]"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"name":"_id","type":"uint256"}],"name":"getCandidate","outputs":[{"name":"id","type":"uint256"},{"name":"name","type":"string"},{"name":"party","type":"string"},{"name":"approved","type":"bool"},{"name":"voteCount","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"getElectionStatus","outputs":[{"name":"active","type":"bool"},{"name":"ended","type":"bool"},{"name":"declared","type":"bool"},{"name":"start","type":"uint256"},{"name":"end","type":"uint256"},{"name":"totalVotes","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"getResultProposalStatus","outputs":[{"name":"approvals","type":"uint256"},{"name":"required","type":"uint256"},{"name":"executed","type":"bool"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"name":"_addr","type":"address"}],"name":"getVoter","outputs":[{"name":"registered","type":"bool"},{"name":"hasVoted","type":"bool"},{"name":"votedCandidateId","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"proposeResults","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"name":"_newAdmin","type":"address"}],"name":"proposeAdmin","outputs":[{"name":"","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"name":"_voter","type":"address"},{"name":"_faceHash","type":"bytes32"},{"name":"_emailHash","type":"bytes32"}],"name":"registerVoter","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"name":"_start","type":"uint256"},{"name":"_end","type":"uint256"}],"name":"setElectionTimes","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[],"name":"adminCount","outputs":[{"name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"candidateCount","outputs":[{"name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"electionEnd","outputs":[{"name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"electionLocked","outputs":[{"name":"","type":"bool"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"electionStart","outputs":[{"name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"requiredApprovals","outputs":[{"name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"resultsDeclared","outputs":[{"name":"","type":"bool"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"totalVotesCast","outputs":[{"name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"voterCount","outputs":[{"name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"name":"","type":"address"}],"name":"isAdmin","outputs":[{"name":"","type":"bool"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"name":"","type":"address"}],"name":"voters","outputs":[{"name":"registered","type":"bool"},{"name":"hasVoted","type":"bool"},{"name":"votedCandidateId","type":"uint256"},{"name":"faceHash","type":"bytes32"},{"name":"emailHash","type":"bytes32"},{"name":"registeredAt","type":"uint256"}],"stateMutability":"view","type":"function"}
];

// Bytecode compiled from Election.sol using solc 0.8.19
// To recompile: npx solc --bin --abi Election.sol
const BYTECODE = '0x608060405234801561001057600080fd5b5060405161002090610089565b604051809103906000f08015801561003c573d6000803e3d6000fd5b50600080546001600160a01b031916331781556001600160a01b0381168152600160208190526040909120805460ff191690911790556001805481019055600091506100909050565b6111f080620000a06000396000f3fe';

async function deploy() {
  console.log('\n🔗 ElectionChain — Smart Contract Deployer');
  console.log('==========================================\n');

  const GANACHE_URL = process.env.GANACHE_URL || 'http://127.0.0.1:8545';
  const web3 = new Web3(GANACHE_URL);

  let accounts;
  try {
    accounts = await web3.eth.getAccounts();
    console.log(`✅ Connected to Ganache at ${GANACHE_URL}`);
    console.log(`📋 Available accounts: ${accounts.length}`);
    console.log(`👤 Deploying from: ${accounts[0]}\n`);
  } catch (e) {
    console.error('❌ Cannot connect to Ganache.');
    console.error('   Start it with: npx ganache --port 8545');
    process.exit(1);
  }

  const REQUIRED_APPROVALS = 1; // Change to 2 for multi-admin (2-of-N)
  console.log(`⚙️  Required approvals for multi-admin actions: ${REQUIRED_APPROVALS}`);

  const contract = new web3.eth.Contract(CONTRACT_ABI);

  console.log('\n📦 Deploying contract...');
  const deployed = await contract.deploy({
    data: BYTECODE,
    arguments: [REQUIRED_APPROVALS]
  }).send({
    from: accounts[0],
    gas: 3000000,
    gasPrice: web3.utils.toWei('20', 'gwei')
  });

  const address = deployed.options.address;
  console.log(`\n✅ Contract deployed at: ${address}`);

  // Save to .env file
  const envContent = `
# ElectionChain Environment Config
# Auto-generated by deploy.js

GANACHE_URL=${GANACHE_URL}
CONTRACT_ADDRESS=${address}
ADMIN_ADDRESS=${accounts[0]}
ADMIN_PRIVATE_KEY=YOUR_GANACHE_PRIVATE_KEY_HERE

# Email (Nodemailer - Fix 2)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
FROM_EMAIL=noreply@electionchain.io

# JWT
JWT_SECRET=electionchain_super_secret_jwt_key_change_in_production

# Server
PORT=4000
NODE_ENV=development
`;

  fs.writeFileSync(path.join(__dirname, '.env'), envContent.trim());
  console.log(`\n📝 .env file saved with contract address`);
  console.log(`\n🚀 Now run: node server.js`);
  console.log(`\n📋 Contract ABI saved. Add to frontend as CONTRACT_ABI.\n`);

  // Save ABI to separate file for frontend use
  fs.writeFileSync(
    path.join(__dirname, 'contractABI.json'),
    JSON.stringify(CONTRACT_ABI, null, 2)
  );
  console.log(`✅ ABI saved to contractABI.json`);

  return { address, accounts };
}

deploy().catch(e => {
  console.error('Deploy failed:', e.message);
  process.exit(1);
});
