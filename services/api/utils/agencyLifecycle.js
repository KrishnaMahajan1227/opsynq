const BeneficiaryContext = require('../models/platform/BeneficiaryContext');
const Notification = require('../models/platform/Notification');
const AuditLog = require('../models/platform/AuditLog');
const ServiceCase = require('../models/platform/ServiceCase');

const text = (v) => String(v == null ? '' : v).trim();

function validateApplicationTransition(farmer, nextStatus) {
  const current = text(farmer?.applicationStatus || 'Pending');
  const next = text(nextStatus);
  if (!next || next === current) return null;

  if (next === 'Move to Installation') {
    if (farmer.inspectionStatus !== 'Completed') return 'Survey must be completed before moving to installation.';
    if (farmer.jsrDeviationYesNo !== 'JSR OUTCOME ACCEPTED') return 'JSR outcome must be accepted before moving to installation.';
  }
  if (next === 'Ordered' && !['Move to Installation', 'Pending Installation', 'Ordered'].includes(current)) {
    return 'Beneficiary must be moved to installation before material can be ordered.';
  }
  if (next === 'Dispatch Completed' && !['Ordered', 'Dispatch Completed'].includes(current)) {
    return 'Material must be ordered before dispatch can be completed.';
  }
  if (next === 'Ready for Installation') {
    if (current !== 'Dispatch Completed' && current !== 'Ready for Installation') return 'Dispatch must be completed before marking ready for installation.';
    if (farmer.materialReceivedConfirmationYesNo && farmer.materialReceivedConfirmationYesNo !== 'Yes') return 'Material receipt must be confirmed before installation can start.';
  }
  if (next === 'Closed') {
    if (current !== 'Installation Completed' && current !== 'Closed') return 'Installation must be completed before closing the beneficiary.';
    if (farmer.complaintStatus && !['Resolved', ''].includes(farmer.complaintStatus)) return 'Open complaint must be resolved before closing the beneficiary.';
  }
  if (current === 'Complaint Raised' && next !== 'Complaint Raised' && next !== 'Installation Completed' && next !== 'Closed') {
    return 'Resolve or complete the complaint/rework before moving to another lifecycle stage.';
  }
  return null;
}

async function contextForFarmer(farmerId) {
  return BeneficiaryContext.findOne({ farmerId }).lean();
}

async function publishAgencyProgress({ req, farmer, context, action, title, message, type = 'INFO', after, actionUrl = 'beneficiary-records' }) {
  const ctx = context || await contextForFarmer(farmer?._id);
  if (!ctx?.companyId || !farmer?._id) return;
  const actorName = req?.user?.username || req?.user?.name || req?.user?.mobile || 'Agency user';
  const actorRole = req?.user?.role || 'agency';
  await Promise.allSettled([
    Notification.create({
      companyId: ctx.companyId,
      recipientRoles: ['company_owner', 'company_admin', 'operations_manager', 'program_manager', 'quality_user'],
      type,
      title,
      message,
      entityType: 'Farmer',
      entityId: farmer._id,
      actionUrl,
    }),
    AuditLog.create({
      companyId: ctx.companyId,
      organizationId: ctx.agencyId || null,
      actorId: req?.user?._id || null,
      actorType: actorRole,
      action,
      entityType: 'Farmer',
      entityId: farmer._id,
      after: after || { applicationStatus: farmer.applicationStatus, inspectionStatus: farmer.inspectionStatus },
      reason: `Agency progress by ${actorName}`,
      ip: req?.ip,
      userAgent: req?.headers?.['user-agent'],
    }),
  ]);
}

async function syncComplaintServiceCase({ req, farmer, context, resolved = false }) {
  const ctx = context || await contextForFarmer(farmer?._id);
  if (!ctx?.companyId || !farmer?._id) return null;
  const complaintNo = text(farmer.complaintNumber) || `LEG-${farmer._id}`;
  const baseQuery = { companyId: ctx.companyId, farmerId: farmer._id, type: 'COMPLAINT' };
  let item = await ServiceCase.findOne({ ...baseQuery, 'metadata.legacyComplaintNo': complaintNo });
  let serviceCaseNo = complaintNo;
  if (!item && !resolved) {
    const exact = await ServiceCase.findOne({ companyId: ctx.companyId, caseNo: complaintNo });
    if (exact && String(exact.farmerId || '') === String(farmer._id)) item = exact;
    else if (exact) serviceCaseNo = `${complaintNo}-${String(farmer._id).slice(-6)}`;
  }
  if (!item && !resolved) {
    item = new ServiceCase({
      companyId: ctx.companyId,
      agencyId: ctx.agencyId,
      farmerId: farmer._id,
      caseNo: serviceCaseNo,
      type: 'COMPLAINT',
      priority: farmer.pumpNotOperatingYesNo === 'No' ? 'HIGH' : 'MEDIUM',
      status: farmer.reworkAssignTechnician ? 'ASSIGNED' : 'OPEN',
      title: `Beneficiary complaint · ${farmer.beneficiaryId || farmer.beneficiaryName || complaintNo}`,
      description: text(farmer.complaintIssue || farmer.issues) || 'Agency reported beneficiary complaint.',
      source: 'LEGACY_COMPLAINT',
      openedAt: farmer.complaintRaisedDate || new Date(),
      metadata: { legacyComplaintNo: complaintNo, raisedByName: farmer.complaintRaisedByName || req?.user?.username || '' },
    });
  }
  if (!item) return null;
  item.agencyId = ctx.agencyId || item.agencyId;
  item.description = text(farmer.complaintIssue || farmer.issues) || item.description;
  if (resolved) {
    item.status = 'RESOLVED';
    item.resolvedAt = farmer.solutionDate || new Date();
    item.resolution = text(farmer.reWork || farmer.remarks) || 'Resolved by agency technician.';
  } else if (farmer.reworkAssignTechnician) {
    item.status = item.status === 'OPEN' ? 'ASSIGNED' : item.status;
  }
  await item.save();
  return item;
}

module.exports = { validateApplicationTransition, contextForFarmer, publishAgencyProgress, syncComplaintServiceCase };
