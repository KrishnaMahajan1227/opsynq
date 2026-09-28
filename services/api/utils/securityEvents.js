const crypto = require('crypto');
const SecurityEvent = require('../models/SecurityEvent');

const hashIdentifier = (value) => value ? crypto.createHash('sha256').update(String(value).trim().toLowerCase()).digest('hex') : '';

async function recordSecurityEvent(req, payload = {}) {
  try {
    await SecurityEvent.create({
      realm: payload.realm || 'system',
      action: payload.action || 'UNKNOWN',
      userId: payload.userId || null,
      success: payload.success !== false,
      identifierHash: hashIdentifier(payload.identifier),
      ip: String(req?.ip || '').slice(0, 120),
      userAgent: String(req?.get?.('user-agent') || '').slice(0, 500),
      requestId: String(req?.requestId || '').slice(0, 120),
      metadata: payload.metadata || {},
    });
  } catch (error) {
    console.error('Security event write failed:', error.message);
  }
}

module.exports = { recordSecurityEvent, hashIdentifier };
