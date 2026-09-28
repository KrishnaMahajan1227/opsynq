const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  codeHash: { type: String, required: true, unique: true, index: true },
  legacyUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
  usedAt: { type: Date, default: null },
  ip: String,
  userAgent: String,
}, { timestamps: true });

module.exports = mongoose.model('AuthHandoff', schema);
