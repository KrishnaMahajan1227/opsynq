const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  realm: { type: String, enum: ['platform', 'agency', 'system'], required: true, index: true },
  action: { type: String, required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, default: null, index: true },
  success: { type: Boolean, default: true, index: true },
  identifierHash: { type: String, default: '' },
  ip: { type: String, default: '' },
  userAgent: { type: String, default: '' },
  requestId: { type: String, default: '' },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

schema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 180 });

module.exports = mongoose.model('SecurityEvent', schema);
