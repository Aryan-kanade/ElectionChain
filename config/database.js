/**
 * config/database.js
 * MongoDB connection management via Mongoose.
 */

const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/electionchain';
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log(`✅ MongoDB: ${uri.replace(/\/\/.*@/, '//<credentials>@')}`);
    return true;
  } catch (e) {
    console.error(`❌ MongoDB failed: ${e.message}`);
    return false;
  }
}

module.exports = { connectDB };
