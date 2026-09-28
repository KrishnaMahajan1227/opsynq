const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const redact = (uri='') => uri.replace(/(mongodb(?:\+srv)?:\/\/[^:]+:)[^@]+@/i, '$1***@');

(async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('✗ MONGO_URI is not configured in services/api/.env');
    process.exit(1);
  }
  console.log('Testing MongoDB Atlas connection...');
  console.log('URI:', redact(uri));
  try {
    await mongoose.connect(uri, { dbName: process.env.MONGO_DB_NAME || 'OPSYNQ', serverSelectionTimeoutMS: 12000, connectTimeoutMS: 12000 });
    const admin = mongoose.connection.db.admin();
    const ping = await admin.ping();
    console.log('✓ MongoDB connected successfully');
    console.log('Database:', mongoose.connection.name);
    console.log('Host:', mongoose.connection.host);
    console.log('Ping:', JSON.stringify(ping));
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('✗ MongoDB connection failed');
    console.error('Name:', err?.name || 'Error');
    console.error('Message:', err?.message || String(err));
    if (/tls|ssl|handshake/i.test(err?.message || '')) {
      console.error('\nTLS hint: verify Atlas IP access, Windows root certificates, system clock, VPN/proxy/antivirus TLS inspection, and try another network.');
    }
    process.exit(1);
  }
})();
