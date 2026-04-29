const app                            = require('./app');
const { connectDB }                  = require('./config/database');
const { connectBlockchain, state }   = require('./config/blockchain');

const PORT = process.env.PORT || 4000;

async function start() {
  const dbOk = await connectDB();
  await connectBlockchain();

  app.listen(PORT, () => {
    console.log('\n🗳️  ElectionChain Backend — v4.0');
    console.log('=====================================');
    console.log(`🚀  http://localhost:${PORT}`);
    console.log(`🗄️  MongoDB:    ${dbOk ? '✅ Connected' : '❌ FAILED'}`);
    console.log(`🔗  Blockchain: ${state.blockchainConnected ? `✅ ${state.networkName}` : '⚠️  DB-only mode'}`);
    console.log(`📧  Email:      ${process.env.SMTP_USER ? '✅ Configured' : '⚠️  Dev mode (OTP → console)'}`);
  });
}

start();
