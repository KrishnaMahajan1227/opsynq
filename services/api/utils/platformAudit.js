const AuditLog = require('../models/platform/AuditLog');

module.exports = async function platformAudit(req, payload) {
  try {
    await AuditLog.create({
      companyId: payload.companyId || req?.tenant?.companyId || null,
      organizationId: payload.organizationId || req?.platformUser?.organizationId?._id || req?.platformUser?.organizationId || null,
      actorId: req?.platformUser?._id || payload.actorId || null,
      actorType: req?.platformUser?.role || payload.actorType || 'system',
      action: payload.action,
      entityType: payload.entityType,
      entityId: payload.entityId || null,
      before: payload.before,
      after: payload.after,
      reason: payload.reason,
      bulkOperationId: payload.bulkOperationId,
      ip: req?.ip,
      userAgent: req?.headers?.['user-agent'],
    });
  } catch (err) {
    console.error('Platform audit write failed:', err.message);
  }
};
