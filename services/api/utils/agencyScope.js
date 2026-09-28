const AgencyUserLink = require('../models/platform/AgencyUserLink');
const BeneficiaryContext = require('../models/platform/BeneficiaryContext');

const technicianAssignmentFilter = (user = {}) => ({
  $or: [
    { surveyorMobile: String(user.mobile || '') },
    { surveyorName: String(user.username || '') },
    { jsrTechnician: String(user.username || '') },
    { installedByTechnicianName: String(user.username || '') },
    { reworkAssignTechnician: String(user.username || '') },
    { confirmedBy: String(user.username || '') },
  ],
});

async function resolveAgencyScope(user) {
  if (!user?._id) return { linked: false, agencyIds: [], farmerIds: [] };
  const links = await AgencyUserLink.find({ legacyUserId: user._id, isActive: true })
    .select('agencyId companyId role')
    .lean();
  if (!links.length) return { linked: false, agencyIds: [], farmerIds: [] };
  const agencyIds = [...new Set(links.map((x) => String(x.agencyId)).filter(Boolean))];
  const contexts = await BeneficiaryContext.find({ agencyId: { $in: agencyIds } })
    .select('farmerId agencyId companyId')
    .lean();
  return {
    linked: true,
    agencyIds,
    companyIds: [...new Set(links.map((x) => String(x.companyId)).filter(Boolean))],
    farmerIds: [...new Set(contexts.map((x) => String(x.farmerId)).filter(Boolean))],
  };
}

async function farmerQueryForUser(user) {
  const scope = await resolveAgencyScope(user);
  const clauses = [];
  if (scope.linked) clauses.push({ _id: { $in: scope.farmerIds } });
  if (user?.role === 'field_technician') clauses.push(technicianAssignmentFilter(user));
  return { scope, query: clauses.length === 0 ? {} : clauses.length === 1 ? clauses[0] : { $and: clauses } };
}

async function canAccessFarmer(user, farmer) {
  if (!farmer || !user) return false;
  const { scope } = await farmerQueryForUser(user);
  if (scope.linked && !scope.farmerIds.includes(String(farmer._id))) return false;
  if (user.role !== 'field_technician') return true;
  const username = String(user.username || '');
  const mobile = String(user.mobile || '');
  return [
    String(farmer.surveyorMobile || '') === mobile,
    String(farmer.surveyorName || '') === username,
    String(farmer.jsrTechnician || '') === username,
    String(farmer.installedByTechnicianName || '') === username,
    String(farmer.reworkAssignTechnician || '') === username,
    String(farmer.confirmedBy || '') === username,
  ].some(Boolean);
}

module.exports = { resolveAgencyScope, farmerQueryForUser, canAccessFarmer, technicianAssignmentFilter };
