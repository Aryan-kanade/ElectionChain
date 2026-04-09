/**
 * ElectionChain — server.js
 * Entry point: connects DB + blockchain, then starts HTTP server.
 */

const app                  = require('./app');
const { connectDB }        = require('./config/database');
const { connectBlockchain, state } = require('./config/blockchain');

const PORT = process.env.PORT || 4000;

async function start() {
  const dbOk = await connectDB();
  await connectBlockchain();

  app.listen(PORT, () => {
    console.log('\n🗳️  ElectionChain Backend — v4.0');
    console.log('=====================================');
    console.log(`🚀  http://localhost:${PORT}`);
    console.log(`🗄️  MongoDB:    ${dbOk ? '✅ Connected' : '❌ FAILED — data will NOT persist!'}`);
    console.log(`🔗  Blockchain: ${state.blockchainConnected ? `✅ ${state.networkName}` : '⚠️  DB-only mode'}`);
    console.log(`📧  Email:      ${process.env.SMTP_USER ? '✅ Configured' : '⚠️  Dev mode (OTP → console)'}`);
    if (!dbOk) console.log('\n⚠️  Run: mongod  OR set MONGODB_URI in .env\n');
  });
}

start();
