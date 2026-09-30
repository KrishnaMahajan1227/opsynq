// config/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: process.env.MONGO_DB_NAME || 'OPSYNQ',
      maxPoolSize: Math.max(10, Number(process.env.MONGO_MAX_POOL_SIZE || 30)),
      minPoolSize: Math.max(0, Number(process.env.MONGO_MIN_POOL_SIZE || 2)),
      maxIdleTimeMS: Math.max(10000, Number(process.env.MONGO_MAX_IDLE_MS || 60000)),
      serverSelectionTimeoutMS: Math.max(5000, Number(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS || 12000)),
      socketTimeoutMS: Math.max(15000, Number(process.env.MONGO_SOCKET_TIMEOUT_MS || 45000)),
    });
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;