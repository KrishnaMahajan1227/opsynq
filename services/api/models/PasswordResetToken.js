const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  tokenHash: { type: String, required: true, unique: true, index: true },
  realm: { type: String, enum: ['platform', 'agency'], required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
  usedAt: { type: Date, default: null },
  requestedIp: { type: String, default: '' },
  requestedUserAgent: { type: String, default: '' },
  consumedIp: { type: String, default: '' },
  consumedUserAgent: { type: String, default: '' },
}, { timestamps: true });

schema.index({ realm: 1, userId: 1, usedAt: 1, expiresAt: 1 });

module.exports = mongoose.model('PasswordResetToken', schema);
