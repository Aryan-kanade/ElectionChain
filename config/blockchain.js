/**
 * config/blockchain.js
 * Web3 + contract initialisation.
 * Uses a state object so consumers always read the live value after init.
 */

const { Web3 } = require('web3');

const state = {
  web3:                null,
  contract:            null,
  blockchainConnected: false,
  networkName:         'Ganache (local)',
};

let CONTRACT_ABI = [];
try {
  CONTRACT_ABI = require('../contractABI.json');
} catch {
  console.warn('⚠️  contractABI.json not found — run: node deploy.js');
}

async function connectBlockchain() {
  const rpcUrl =
    process.env.POLYGON_AMOY_RPC ||
    process.env.SEPOLIA_RPC       ||
    process.env.GANACHE_URL       ||
    'http://127.0.0.1:8545';

  state.networkName =
    process.env.POLYGON_AMOY_RPC ? 'Polygon Amoy Testnet' :
    process.env.SEPOLIA_RPC       ? 'Ethereum Sepolia'     :
    'Ganache (local)';

  try {
    state.web3 = new Web3(rpcUrl);
    await state.web3.eth.net.isListening();

    const addr = process.env.CONTRACT_ADDRESS;
    if (addr && addr !== 'YOUR_CONTRACT_ADDRESS_AFTER_DEPLOY' && CONTRACT_ABI.length > 0) {
      state.contract            = new state.web3.eth.Contract(CONTRACT_ABI, addr);
      state.blockchainConnected = true;
      console.log(`✅ Blockchain: ${state.networkName} — ${addr}`);
    } else {
      console.log('⚠️  CONTRACT_ADDRESS not set — running in DB-only mode');
    }
  } catch (e) {
    console.log(`⚠️  Blockchain unavailable (${state.networkName}): ${e.message}`);
  }
}

async function sendTx(method, opts = {}) {
  const pk        = process.env.ADMIN_PRIVATE_KEY;
  const adminAddr = process.env.ADMIN_ADDRESS;

  if (!pk || pk === 'YOUR_PRIVATE_KEY') {
    return method.send({ from: adminAddr, gas: opts.gas || 300000 });
  }

  const gasEstimate = await method.estimateGas({ from: adminAddr })
    .catch(() => BigInt(opts.gas || 300000));
  const gasPrice = await state.web3.eth.getGasPrice();
  const nonce    = await state.web3.eth.getTransactionCount(adminAddr, 'pending');

  const signed = await state.web3.eth.accounts.signTransaction({
    from:  adminAddr,
    to:    process.env.CONTRACT_ADDRESS,
    gas:   Math.round(Number(gasEstimate) * 1.3),
    gasPrice, nonce,
    data:  method.encodeABI(),
  }, pk);

  return state.web3.eth.sendSignedTransaction(signed.rawTransaction);
}

module.exports = { connectBlockchain, sendTx, state };
