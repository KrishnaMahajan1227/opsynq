const Farmer = require('../models/Farmer');
const User = require('../models/User');
const AdminChangeLog = require('../models/AdminChangeLog');
const TechnicianChangeRequest = require('../models/TechnicianChangeRequest');
const multer = require('multer');
const xlsx = require('xlsx');
const fs = require('fs');
const mongoose = require('mongoose');
const asyncHandler = require('express-async-handler');
const { farmerQueryForUser, canAccessFarmer, resolveAgencyScope } = require('../utils/agencyScope');
const { redactFarmer } = require('../utils/pii');
const { validateApplicationTransition, contextForFarmer, publishAgencyProgress, syncComplaintServiceCase } = require('../utils/agencyLifecycle');

/* Multer setup for Excel uploads using memory storage */
const storage = multer.memoryStorage();
const upload = multer({ storage });

/* Excel → schema field mapping */
const mapping = {
  'Beneficiary ID': 'beneficiaryId',
  'Beneficiary Name': 'beneficiaryName',
  'Mobile': 'mobile',
  'Alternate Mobile number': 'alternateMobileNumber',
  'Aadhar No': 'aadharNo',
  'Scheme': 'scheme',
  'Caste Category': 'casteCategory',
  'Land Address': 'landAddress',
  'VILLAGE': 'village',
  'TALUKA': 'taluka',
  'DISTRICT': 'district',
  'DIVISION NAME': 'divisionName',
  'CIRCLE NAME': 'circleName',
  'ZONE NAME': 'zoneName',
  'Site Depth': 'siteDepth',
  'Inspection Status': 'inspectionStatus',
  'Application Status': 'applicationStatus',
  'Site Location': 'siteLocation',
  'Pump Type': 'pumpType',
  'Pump HP': 'pumpHP',
  'ControllerType with uspc/Without': 'controllerTypeWithOrWithout',
  'Assigned Vendor / Company Name': 'assignedVendorCompanyName',
  'Vendor Assignment Date': 'vendorAssignmentDate',
  'Surveyor Name': 'surveyorName',
  'Surveyor Mobile': 'surveyorMobile',
  'Source Type': 'sourceType',
  'Land Holding (Acre)': 'landHoldingAcre',
  'Land Ownership Type': 'landOwnershipType',
  'Actual HEAD (m)': 'actualHeadM',
  'Source Depth (Feet)': 'sourceDepthFeet',
  'JSR Deviation (Yes/No)': 'jsrDeviationYesNo',
  'Deviation Remarks': 'deviationRemarks',
  'Survey Date': 'surveyDate',
  'JSR-Technician': 'jsrTechnician',
  'Material On site or Warehouse': 'materialOnSiteOrWarehouse',
  'Warehouse Inward Date': 'warehouseInwardDate',
  'Vehicle No': 'vehicleNo',
  'Lot No': 'lotNo',
  'Full set/ Partial Set': 'fullSetOrPartialSet',
  'Invoice No': 'invoiceNo',
  'Waybill No from Company': 'waybillNoFromCompany',
  'Lot': 'lot',
  'Material Dispatch Date': 'materialDispatchDate',
  'Transporter Name': 'transporterName',
  'Vehicle No.': 'transporterVehicleNo',
  'Material Received Confirmation (Yes/No)': 'materialReceivedConfirmationYesNo',
  'Shortage/ Damaged Remarks': 'shortageDamagedRemarks',
  'Invoice Date': 'invoiceDate',
  'Waybill No': 'waybillNo',
  'Delivery Challan No': 'deliveryChallanNo',
  'Installation Date': 'installationDate',
  'Installation Completion Date': 'installationCompletionDate',
  'Installed By (Technician Name)': 'installedByTechnicianName',
  'Installation Technician': 'installationAssignedTechnician',
  'Installation Technician Mobile': 'installationAssignedTechnicianMobile',
  'Commissioning Date': 'commissioningDate',
  'Installed Photo Upload': 'installedPhotoUpload',
  'Pump No Unique': 'pumpNoUnique',
  'Motor No Unique': 'motorNoUnique',
  'Controller No Unique': 'controllerNoUnique',
  'IMEI No Unique': 'imeiNoUnique',
  'Bill Submitted to Vendor Company Yes/No': 'billSubmittedToVendorYesNo',
  'Invoice No of Bill(Vendor)': 'invoiceNoOfBillVendor',
  'Rate(Vendor)': 'rateVendor',
  'Payment Recived Amount': 'paymentReceivedAmount',
  'Date': 'paymentReceivedDate',
  'Assigned To (CRM/Executive) Admin': 'assignedToCRMExecutiveAdmin',
  'Material Partially Dispatch Date': 'materialPartiallyDispatchDate',
  'Material Completely Dispatch Date': 'materialCompletelyDispatchDate',
  'Installation Done (Yes/No)': 'installationDoneYesNo',
  'Pump Not Operating (Yes/No)': 'pumpNotOperatingYesNo',
  'Malfunction Complaint Raised Date': 'complaintRaisedDate',
  'Complaint Issue': 'complaintIssue',
  'Complaint Number': 'complaintNumber',
  'Complaint Raised By Name': 'complaintRaisedByName',
  'Complaint Raised By Id': 'complaintRaisedById',
  'Complaint Status': 'complaintStatus',
  'Company Assigned Person Name': 'companyAssignedPersonName',
  'Subcontractor Rate': 'subcontractorRate',
  'Subcontractor Bill': 'subcontractorBill',
  'Payment Given to Subcontractor': 'paymentGivenToSubcontractor',
  'Payment Pending': 'paymentPending',
  'Our Bill Received': 'ourBillReceived',
  'Our Bill Pending': 'ourBillPending',
  'Rework Work': 'reWork',
  'Issues': 'issues',
  'Rework Assign Technician': 'reworkAssignTechnician',
  'Rework assign Date': 'reworkAssignDate',
  'Solution Date': 'solutionDate',
  'Charges To Debit': 'chargesToDebit',
  'Farmer Photo URL': 'farmerPhotoUrl',
  'Site Photos URLs': 'sitePhotosUrls',
  'Signature URL': 'signatureUrl',
  'Final Farmer Photo URL': 'finalfarmerPhotoUrl',
  'Final Site Photos URLs': 'finalsitePhotosUrls',
  'Final Signature URL': 'finalsignatureUrl',
  'Final Surveyor Signature URL': 'finalsurveyorsignatureUrl'
};

const dateFields = [
  'Vendor Assignment Date',
  'Survey Date',
  'Warehouse Inward Date',
  'Material Dispatch Date',
  'Invoice Date',
  'Installation Date',
  'Installation Completion Date',
  'Commissioning Date',
  'Date',
  'Material Partially Dispatch Date',
  'Material Completely Dispatch Date',
  'Malfunction Complaint Raised Date',
  'Rework assign Date',
  'Solution Date'
];

function toDate(v) {
  if (v instanceof Date) return v;
  if (v == null || v === '') return undefined;
  if (typeof v === 'number') {
    return new Date(Math.round((v - 25569) * 86400 * 1000));
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(v)) return new Date(v);
  const m = v.replace(/\//g, '-').match(/^(\d{1,2})-(\d{1,2})-(\d{2,4})$/);
  if (m) {
    const [, d, M, Y] = m;
    const year = Y.length === 2 ? '20' + Y : Y.padStart(4, '0');
    return new Date(`${year}-${M.padStart(2, '0')}-${d.padStart(2, '0')}`);
  }
  const d2 = new Date(v);
  return isNaN(d2) ? undefined : d2;
}

const keepInspection = s => ['Done', 'Completed'].includes(s);

async function scopedTechniciansForUser(user) {
  const scope = await resolveAgencyScope(user);
  let query = { role: 'field_technician', isActive: true };
  if (scope.linked) {
    const AgencyUserLink = require('../models/platform/AgencyUserLink');
    const links = await AgencyUserLink.find({ agencyId: { $in: scope.agencyIds }, isActive: true }).select('legacyUserId').lean();
    query._id = { $in: links.map((x) => x.legacyUserId) };
  } else if (!scope.demoUnscoped) {
    query._id = { $in: [] };
  }
  return User.find(query).select('username mobile email role').lean();
}

const ASSIGNMENT_TYPES = {
  SURVEY: { nameField: 'surveyorName', mobileField: 'surveyorMobile' },
  INSTALLATION: { nameField: 'installationAssignedTechnician', mobileField: 'installationAssignedTechnicianMobile' },
  REWORK: { nameField: 'reworkAssignTechnician', mobileField: null },
};

async function enrichFarmerOwnership(farmers = []) {
  const rows = Array.isArray(farmers) ? farmers : [];
  const ids = rows.filter((x) => x?._id && !String(x.assignedVendorCompanyName || '').trim()).map((x) => x._id);
  if (!ids.length) return rows;
  const BeneficiaryContext = require('../models/platform/BeneficiaryContext');
  const contexts = await BeneficiaryContext.find({ farmerId: { $in: ids } })
    .select('farmerId companyId agencyId assignedByName assignedAt')
    .populate('companyId', 'name code')
    .populate('agencyId', 'name code')
    .lean();
  const byFarmer = new Map(contexts.map((x) => [String(x.farmerId), x]));
  return rows.map((farmer) => {
    if (String(farmer.assignedVendorCompanyName || '').trim()) return farmer;
    const ctx = byFarmer.get(String(farmer._id));
    if (!ctx) return farmer;
    return {
      ...farmer,
      assignedVendorCompanyName: ctx.companyId?.name || ctx.companyId?.code || '',
      assignedAgencyName: ctx.agencyId?.name || ctx.agencyId?.code || '',
      opsynqAssignmentAt: ctx.assignedAt || null,
      opsynqAssignedByName: ctx.assignedByName || '',
    };
  });
}

// GET /api/farmers
exports.getFarmers = async (req, res) => {
  try {
    const { query: scopeQuery } = await farmerQueryForUser(req.user);
    const filters = {};
    const exact = [['district','district'],['division','divisionName'],['taluka','taluka'],['scheme','scheme'],['vendor','assignedVendorCompanyName'],['applicationStatus','applicationStatus'],['inspectionStatus','inspectionStatus'],['inspectionStatusFinal','inspectionStatusFinal']];
    for (const [param, field] of exact) if (req.query[param]) filters[field] = String(req.query[param]).trim();
    if (req.query.q) {
      const escaped = String(req.query.q).trim().slice(0,80).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (escaped) { const rx = new RegExp(escaped, 'i'); filters.$or = [{beneficiaryId:rx},{beneficiaryName:rx},{mobile:rx},{aadharNo:rx},{village:rx},{taluka:rx},{district:rx}]; }
    }
    const query = Object.keys(filters).length ? {$and:[scopeQuery,filters]} : scopeQuery;
    const paged = req.query.page !== undefined || req.query.pageSize !== undefined || req.query.mode === 'page';
    if (paged) {
      const page = Math.max(1, Number(req.query.page || 1)), pageSize = Math.min(200, Math.max(10, Number(req.query.pageSize || 50)));
      const [total, farmers] = await Promise.all([
        Farmer.countDocuments(query),
        Farmer.find(query).sort({updatedAt:-1,_id:-1}).skip((page-1)*pageSize).limit(pageSize).lean(),
      ]);
      const enriched = await enrichFarmerOwnership(farmers);
      return res.status(200).json({items:enriched.map(redactFarmer),total,page,pageSize,pages:Math.max(1,Math.ceil(total/pageSize))});
    }
    const farmers = await Farmer.find(query).sort({updatedAt:-1,_id:-1}).lean();
    const enriched = await enrichFarmerOwnership(farmers);
    res.status(200).json(enriched.map(redactFarmer));
  } catch (err) {
    console.error('Error in getFarmers:', err.message);
    res.status(500).json({ message: 'Failed to fetch farmers' });
  }
};

// GET /api/farmers/:id
exports.getFarmerById = async (req, res) => {
  try {
    const farmerId = req.params.id;
    if (!mongoose.isValidObjectId(farmerId)) {
      return res.status(400).json({ message: 'Invalid farmer ID' });
    }
    const farmer = await Farmer.findById(farmerId).lean();
    if (!farmer) {
      return res.status(404).json({ message: 'Farmer not found' });
    }
    if (!(await canAccessFarmer(req.user, farmer))) {
      return res.status(403).json({ message: 'You do not have access to this beneficiary.' });
    }
    res.status(200).json(redactFarmer(farmer));
  } catch (err) {
    console.error('Error in getFarmerById:', err.message);
    res.status(500).json({ message: 'Failed to fetch farmer' });
  }
};

// PUT /api/farmers/:id
exports.updateFarmer = async (req, res) => {
  try {
    const farmerId = req.params.id;
    const updateData = { ...req.body };
    if(/^X{4}-X{4}-/i.test(String(updateData.aadharNo||''))) delete updateData.aadharNo;
    const user = req.user;

    if (!mongoose.isValidObjectId(farmerId)) {
      return res.status(400).json({ message: 'Invalid farmer ID' });
    }

    const farmer = await Farmer.findById(farmerId);
    if (!farmer) {
      return res.status(404).json({ message: 'Farmer not found' });
    }
    if (!(await canAccessFarmer(req.user, farmer))) {
      return res.status(403).json({ message: 'You do not have access to this beneficiary.' });
    }

    if (updateData.applicationStatus) {
      const transitionError = validateApplicationTransition(farmer, updateData.applicationStatus);
      if (transitionError) return res.status(409).json({ message: transitionError, code: 'INVALID_LIFECYCLE_TRANSITION' });
    }

    // Identify technician-related fields
    const technicianFields = ['surveyorName', 'surveyorMobile', 'reworkAssignTechnician'];
    const hasTechnicianChanges = Object.keys(updateData).some((key) => technicianFields.includes(key));
    const technicianChanges = {};
    const nonTechnicianChanges = {};

    // Separate technician and non-technician changes
    for (const [key, value] of Object.entries(updateData)) {
      if (technicianFields.includes(key)) {
        technicianChanges[key] = value;
      } else {
        nonTechnicianChanges[key] = value;
      }
    }

    // Validate inspectionStatusFinal if provided
    if (nonTechnicianChanges.inspectionStatusFinal) {
      const validStatuses = [
        'Blocked for further process because PP consumer number of other consumer used',
        'VENDOR INFORMATION RECEIVED',
        'Refund Process Completed and Amount transferred to Beneficiary',
        'PUMP INSTALLATION DETAILS RECEIVED FROM VENDOR',
        'PUMP INSTALLATION INSPECTION DONE BY LINEMAN',
        'SYSTEM DETAILS SUBMITTED',
        ''
      ];
      if (!validStatuses.includes(nonTechnicianChanges.inspectionStatusFinal)) {
        return res.status(400).json({ message: 'Invalid inspectionStatusFinal value' });
      }
    }

    // Log all changes
    const changeDetails = {
      farmerId: farmerId,
      changes: updateData,
      reason: updateData.reason || 'Farmer record update',
    };

    if (hasTechnicianChanges && user.role !== 'superadmin') {
      // Admins require approval for technician changes
      if (!updateData.reason || updateData.reason.trim() === '') {
        return res.status(400).json({ message: 'Reason is required for technician changes' });
      }

      const currentTechnician = {
        username: farmer.surveyorName || '',
        mobile: farmer.surveyorMobile || '',
      };

      const newTechnician = {
        username: technicianChanges.surveyorName || technicianChanges.reworkAssignTechnician || '',
        mobile: technicianChanges.surveyorMobile || '',
      };

      // Validate new technician
      if (newTechnician.username) {
        const technician = await User.findOne({ username: newTechnician.username, role: 'field_technician' }).lean();
        if (!technician) {
          return res.status(400).json({ message: 'Invalid technician selected' });
        }
        newTechnician.mobile = technician.mobile;
      }

      // Check for existing pending requests
      const existingRequest = await TechnicianChangeRequest.findOne({
        farmerId: farmerId,
        status: 'Pending',
      });
      if (existingRequest) {
        return res.status(400).json({ message: 'A technician change request is already pending for this farmer' });
      }

      // Create technician change request
      await TechnicianChangeRequest.create({
        farmerId: farmerId,
        farmerDetails: {
          beneficiaryId: farmer.beneficiaryId,
          beneficiaryName: farmer.beneficiaryName,
          mobile: farmer.mobile,
          aadharNo: farmer.aadharNo,
        },
        requestedBy: user._id,
        requestedByDetails: {
          username: user.username,
          mobile: user.mobile,
          role: user.role,
        },
        currentTechnician,
        newTechnician,
        reason: updateData.reason,
        requestDate: new Date(),
      });

      // Apply non-technician changes if any
      let updatedFarmer = null;
      if (Object.keys(nonTechnicianChanges).length > 0) {
        updatedFarmer = await Farmer.findByIdAndUpdate(
          farmerId,
          { $set: nonTechnicianChanges },
          { new: true, runValidators: true }
        ).lean();
        changeDetails.changes = { ...nonTechnicianChanges, technicianChangeRequested: true };
      } else {
        changeDetails.changes = { technicianChangeRequested: true };
      }

      // Log the action
      await AdminChangeLog.create({
        adminId: user._id,
        changeType: 'technician_assignment',
        details: changeDetails,
      });
      const ctx = await contextForFarmer(farmerId);
      await publishAgencyProgress({ req, farmer: updatedFarmer || farmer, context: ctx, action: 'AGENCY_TECHNICIAN_CHANGE_REQUESTED', title: `Agency assignment change requested · ${farmer.beneficiaryId || farmer.beneficiaryName || 'Beneficiary'}`, message: `${user.username || 'Agency admin'} requested a technician assignment change.`, type: 'ACTION', after: changeDetails.changes });

      return res.status(200).json({
        message: 'Technician change request submitted for approval',
        farmer: Object.keys(nonTechnicianChanges).length > 0 ? updatedFarmer : farmer,
      });
    } else {
      // Superadmin or non-technician changes: apply directly
      const updatedFarmer = await Farmer.findByIdAndUpdate(
        farmerId,
        { $set: updateData },
        { new: true, runValidators: true }
      ).lean();

      // Log the action
      await AdminChangeLog.create({
        adminId: user._id,
        changeType: hasTechnicianChanges ? 'technician_assignment' : 'direct_update',
        details: changeDetails,
      });
      const ctx = await contextForFarmer(farmerId);
      if (updateData.applicationStatus && updateData.applicationStatus !== farmer.applicationStatus) {
        await publishAgencyProgress({ req, farmer: updatedFarmer, context: ctx, action: 'AGENCY_LIFECYCLE_UPDATED', title: `Agency progress · ${updatedFarmer.beneficiaryId || updatedFarmer.beneficiaryName || 'Beneficiary'}`, message: `${farmer.applicationStatus || 'Pending'} → ${updatedFarmer.applicationStatus} by ${user.username || 'Agency user'}.`, type: ['Complaint Raised'].includes(updatedFarmer.applicationStatus) ? 'WARNING' : ['Installation Completed','Closed'].includes(updatedFarmer.applicationStatus) ? 'SUCCESS' : 'INFO', after: { from: farmer.applicationStatus, to: updatedFarmer.applicationStatus } });
      } else if (updateData.jsrDeviationYesNo && updateData.jsrDeviationYesNo !== farmer.jsrDeviationYesNo) {
        await publishAgencyProgress({ req, farmer: updatedFarmer, context: ctx, action: 'AGENCY_JSR_UPDATED', title: `Survey review updated · ${updatedFarmer.beneficiaryId || updatedFarmer.beneficiaryName || 'Beneficiary'}`, message: `JSR status changed to ${updatedFarmer.jsrDeviationYesNo}.`, type: updatedFarmer.jsrDeviationYesNo === 'JSR OUTCOME REJECTED' ? 'WARNING' : 'INFO', after: { jsrDeviationYesNo: updatedFarmer.jsrDeviationYesNo } });
      }
      if (updatedFarmer.applicationStatus === 'Complaint Raised') await syncComplaintServiceCase({ req, farmer: updatedFarmer, context: ctx });
      if (updatedFarmer.complaintStatus === 'Resolved' || (farmer.applicationStatus === 'Complaint Raised' && updatedFarmer.solutionDate)) await syncComplaintServiceCase({ req, farmer: updatedFarmer, context: ctx, resolved: true });

      res.status(200).json(updatedFarmer);
    }
  } catch (err) {
    console.error('Error in updateFarmer:', err.message);
    res.status(500).json({ message: 'Failed to update farmer' });
  }
};

exports.bulkUpdateFarmers = asyncHandler(async (req, res) => {
  const { farmerIds, update, reason } = req.body;
  const user = req.user;

  // Validate request body
  if (!Array.isArray(farmerIds) || farmerIds.length === 0) {
    return res.status(400).json({ message: 'Farmer IDs are required' });
  }
  if (!update || Object.keys(update).length === 0) {
    return res.status(400).json({ message: 'Update data is required' });
  }

  // Validate farmer IDs
  const invalidIds = farmerIds.filter((id) => !mongoose.isValidObjectId(id));
  if (invalidIds.length > 0) {
    return res.status(400).json({ message: 'Invalid farmer IDs provided' });
  }

  // Validate update fields
  const allowedFields = ['surveyorName', 'surveyorMobile', 'inspectionStatus', 'inspectionStatusFinal'];
  const updateFields = Object.keys(update);
  const isValidUpdate = updateFields.every((field) => allowedFields.includes(field));
  if (!isValidUpdate) {
    return res.status(400).json({ message: 'Invalid update fields' });
  }

  // Validate inspectionStatus if provided
  if (update.inspectionStatus && !['Pending', 'In Progress', 'Completed'].includes(update.inspectionStatus)) {
    return res.status(400).json({ message: 'Invalid inspection status' });
  }

  // Validate inspectionStatusFinal if provided
  if (update.inspectionStatusFinal) {
    const validStatuses = [
      'Blocked for further process because PP consumer number of other consumer used',
      'VENDOR INFORMATION RECEIVED',
      'Refund Process Completed and Amount transferred to Beneficiary',
      'PUMP INSTALLATION DETAILS RECEIVED FROM VENDOR',
      'PUMP INSTALLATION INSPECTION DONE BY LINEMAN',
      'SYSTEM DETAILS SUBMITTED',
      ''
    ];
    if (!validStatuses.includes(update.inspectionStatusFinal)) {
      return res.status(400).json({ message: 'Invalid inspectionStatusFinal value' });
    }
  }

  const farmers = await Farmer.find({ _id: { $in: farmerIds } });
  if (farmers.length !== farmerIds.length) {
    return res.status(404).json({ message: 'Some farmers not found' });
  }
  const accessChecks = await Promise.all(farmers.map((farmer) => canAccessFarmer(user, farmer)));
  if (accessChecks.some((allowed) => !allowed)) {
    return res.status(403).json({ message: 'One or more selected beneficiaries are outside your assigned scope.' });
  }

  // Identify technician-related fields
  const technicianFields = ['surveyorName', 'surveyorMobile'];
  const hasTechnicianChanges = updateFields.some((field) => technicianFields.includes(field));
  const technicianChanges = {};
  const nonTechnicianChanges = {};

  for (const [key, value] of Object.entries(update)) {
    if (technicianFields.includes(key)) {
      technicianChanges[key] = value;
    } else {
      nonTechnicianChanges[key] = value;
    }
  }

  // Log details
  const changeDetails = {
    farmerIds,
    changes: update,
    ...(reason && { reason }),
  };

  if (hasTechnicianChanges && user.role !== 'superadmin') {
    // Admins require approval for technician changes
    if (!reason || reason.trim() === '') {
      return res.status(400).json({ message: 'Reason is required for technician changes' });
    }

    const newTechnician = {
      username: technicianChanges.surveyorName || '',
      mobile: technicianChanges.surveyorMobile || '',
    };

    // Validate new technician
    if (newTechnician.username) {
      const technician = await User.findOne({ username: newTechnician.username, role: 'field_technician' }).lean();
      if (!technician) {
        return res.status(400).json({ message: 'Invalid technician selected' });
      }
      newTechnician.mobile = technician.mobile;
    }

    // Check for existing pending requests
    const existingRequests = await TechnicianChangeRequest.find({
      farmerId: { $in: farmerIds },
      status: 'Pending',
    });
    if (existingRequests.length > 0) {
      return res.status(400).json({ message: 'Technician change requests are already pending for some farmers' });
    }

    // Create technician change requests
    const changeRequests = farmers.map((farmer) => ({
      farmerId: farmer._id,
      farmerDetails: {
        beneficiaryId: farmer.beneficiaryId,
        beneficiaryName: farmer.beneficiaryName,
        mobile: farmer.mobile,
        aadharNo: farmer.aadharNo,
      },
      requestedBy: user._id,
      requestedByDetails: {
        username: user.username,
        mobile: user.mobile,
        role: user.role,
      },
      currentTechnician: {
        username: farmer.surveyorName || '',
        mobile: farmer.surveyorMobile || '',
      },
      newTechnician,
      reason,
      requestDate: new Date(),
    }));

    await TechnicianChangeRequest.insertMany(changeRequests);

    // Apply non-technician changes (e.g., inspectionStatus, inspectionStatusFinal)
    let updatedFarmers = farmers;
    if (Object.keys(nonTechnicianChanges).length > 0) {
      updatedFarmers = await Farmer.updateMany(
        { _id: { $in: farmerIds } },
        { $set: nonTechnicianChanges },
        { runValidators: true }
      );
      changeDetails.changes = { ...nonTechnicianChanges, technicianChangeRequested: true };
    } else {
      changeDetails.changes = { technicianChangeRequested: true };
    }

    await AdminChangeLog.create({
      adminId: user._id,
      changeType: 'technician_assignment',
      details: changeDetails,
    });

    res.status(200).json({
      message: 'Technician change requests submitted for approval',
      modifiedCount: Object.keys(nonTechnicianChanges).length > 0 ? updatedFarmers.modifiedCount : 0,
    });
  } else {
    // Superadmin or non-technician changes: apply directly
    const updatedFarmers = await Farmer.updateMany(
      { _id: { $in: farmerIds } },
      { $set: update },
      { runValidators: true }
    );

    await AdminChangeLog.create({
      adminId: user._id,
      changeType: hasTechnicianChanges ? 'technician_assignment' : 'direct_update',
      details: changeDetails,
    });

    res.status(200).json({
      message: 'Farmers updated successfully',
      modifiedCount: updatedFarmers.modifiedCount,
    });
  }
});

// POST /api/farmers/:id/assign-technician
exports.assignTechnician = asyncHandler(async (req, res) => {
  const farmerId = req.params.id;
  const assignmentType = String(req.body.assignmentType || '').toUpperCase();
  const technicianId = String(req.body.technicianId || '');
  const reason = String(req.body.reason || '').trim();
  if (!mongoose.isValidObjectId(farmerId)) return res.status(400).json({ message: 'Invalid farmer ID' });
  if (!ASSIGNMENT_TYPES[assignmentType]) return res.status(400).json({ message: 'Assignment type must be SURVEY, INSTALLATION or REWORK' });
  if (!mongoose.isValidObjectId(technicianId)) return res.status(400).json({ message: 'Select a valid technician' });
  if (reason.length < 3) return res.status(400).json({ message: 'Reason is required for assignment' });

  const farmer = await Farmer.findById(farmerId);
  if (!farmer) return res.status(404).json({ message: 'Beneficiary not found' });
  if (!(await canAccessFarmer(req.user, farmer))) return res.status(403).json({ message: 'This beneficiary is outside your agency scope.' });
  const technicians = await scopedTechniciansForUser(req.user);
  const technician = technicians.find((t) => String(t._id) === technicianId);
  if (!technician) return res.status(403).json({ message: 'Selected technician is not active in your agency.' });

  const fields = ASSIGNMENT_TYPES[assignmentType];
  const currentTechnician = {
    username: String(farmer[fields.nameField] || ''),
    mobile: fields.mobileField ? String(farmer[fields.mobileField] || '') : '',
  };
  const newTechnician = { username: technician.username, mobile: String(technician.mobile || '') };

  if (req.user.role !== 'superadmin') {
    const existingRequest = await TechnicianChangeRequest.findOne({ farmerId, assignmentType, status: 'Pending' }).lean();
    if (existingRequest) return res.status(409).json({ message: `A pending ${assignmentType.toLowerCase()} assignment request already exists for this beneficiary.` });
    const request = await TechnicianChangeRequest.create({
      farmerId,
      assignmentType,
      farmerDetails: { beneficiaryId: farmer.beneficiaryId || '-', beneficiaryName: farmer.beneficiaryName || '-', mobile: farmer.mobile || '-', aadharNo: farmer.aadharNo || '-' },
      requestedBy: req.user._id,
      requestedByDetails: { username: req.user.username, mobile: String(req.user.mobile || ''), role: req.user.role },
      currentTechnician, newTechnician, reason, requestDate: new Date(),
    });
    await AdminChangeLog.create({ adminId: req.user._id, changeType: 'technician_assignment', details: { farmerId, assignmentType, technicianId, technician: newTechnician, reason, requestId: request._id, status: 'PENDING_APPROVAL' } });
    return res.status(202).json({ message: `${assignmentType[0]}${assignmentType.slice(1).toLowerCase()} assignment submitted for approval.`, requestId: request._id, status: 'PENDING_APPROVAL' });
  }

  const update = { [fields.nameField]: technician.username };
  if (fields.mobileField) update[fields.mobileField] = String(technician.mobile || '');
  if (assignmentType === 'INSTALLATION') { update.installationAssignedAt = new Date(); update.installationAssignedBy = req.user._id; }
  if (assignmentType === 'REWORK') update.reworkAssignDate = new Date();
  const updated = await Farmer.findByIdAndUpdate(farmerId, { $set: update }, { new: true, runValidators: true }).lean();
  await AdminChangeLog.create({ adminId: req.user._id, changeType: 'technician_assignment', details: { farmerId, assignmentType, technicianId, technician: newTechnician, reason, changes: update } });
  const ctx = await contextForFarmer(farmerId);
  await publishAgencyProgress({ req, farmer: updated || farmer, context: ctx, action: 'AGENCY_TECHNICIAN_ASSIGNED', title: `${assignmentType[0]}${assignmentType.slice(1).toLowerCase()} technician assigned · ${farmer.beneficiaryId || farmer.beneficiaryName || 'Beneficiary'}`, message: `${technician.username} assigned by ${req.user.username || 'Agency superadmin'}.`, type: 'INFO', after: { assignmentType, technician: newTechnician, reason } });
  res.json({ message: `${assignmentType[0]}${assignmentType.slice(1).toLowerCase()} technician assigned successfully.`, assignmentType, technician: newTechnician, update });
});

// DELETE /api/farmers/:id
exports.deleteFarmer = async (req, res) => {
  try {
    const farmerId = req.params.id;
    const { reason } = req.body;
    const user = req.user;

    if (!mongoose.isValidObjectId(farmerId)) {
      return res.status(400).json({ message: 'Invalid farmer ID' });
    }
    if (!reason || reason.trim() === '') {
      return res.status(400).json({ message: 'Reason is required for deletion' });
    }

    const farmer = await Farmer.findById(farmerId);
    if (!farmer) {
      return res.status(404).json({ message: 'Farmer not found' });
    }
    if (!(await canAccessFarmer(user, farmer))) {
      return res.status(403).json({ message: 'You do not have access to this beneficiary.' });
    }
    await Farmer.deleteOne({ _id: farmerId });

    // Log the action
    await AdminChangeLog.create({
      adminId: user._id,
      changeType: 'farmer_deletion',
      details: {
        farmerId: farmerId,
        reason,
      },
    });

    res.status(200).json({ message: 'Farmer deleted successfully' });
  } catch (err) {
    console.error('Error in deleteFarmer:', err.message);
    res.status(500).json({ message: 'Failed to delete farmer' });
  }
};

exports.downloadExcelTemplate=async(req,res)=>{
  const type=String(req.params.type||'beneficiary').toLowerCase();
  const columns=type==='jsr'?['Beneficiary ID','Beneficiary Name','Mobile','Aadhar No','JSR Status']:Object.keys(mapping);
  const sample=Object.fromEntries(columns.map(k=>[k,k==='Beneficiary ID'?'APP-0001':k==='Beneficiary Name'?'Sample Beneficiary':k==='Mobile'?'9876543210':k==='JSR Status'?'JSR SUBMITTED':'']));
  const ws=xlsx.utils.json_to_sheet([sample],{header:columns});const wb=xlsx.utils.book_new();xlsx.utils.book_append_sheet(wb,ws,type==='jsr'?'JSR Update':'Beneficiaries');
  const help=xlsx.utils.aoa_to_sheet([['Instructions'],['Do not rename required standard headers. Extra columns are reviewed before import and can be preserved as Custom Fields.'],[type==='jsr'?'Required: Beneficiary ID, Beneficiary Name, Mobile, Aadhar No, JSR Status':'Required: Beneficiary ID. Surveyor Name/Mobile, Installation Technician and Rework Assign Technician can be used to carry work ownership into the Agency workflow.'],['Assignment rule'],['Technician usernames must belong to an active technician in the current Agency scope; invalid technician values are not assigned.']]);xlsx.utils.book_append_sheet(wb,help,'Instructions');
  const buf=xlsx.write(wb,{type:'buffer',bookType:'xlsx'});res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');res.setHeader('Content-Disposition',`attachment; filename="opsynq-agency-${type}-template.xlsx"`);res.send(buf);
};

/* POST /uploadExcel */
exports.uploadExcel = [
  upload.single('excel'),
  async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: 'Excel file missing.' });

      const wb = xlsx.read(req.file.buffer, { type: 'buffer' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const raw = xlsx.utils.sheet_to_json(sheet).filter(r => r['Beneficiary ID']);
      const allHeaders = [...new Set(raw.flatMap((row) => Object.keys(row || {})))];
      const knownHeadersForImport = new Set([...Object.keys(mapping), ...Array.from({ length: 20 }, (_, i) => `Panel${i + 1}`)]);
      const customHeaders = allHeaders.filter((header) => !knownHeadersForImport.has(header));
      const customFieldDecision = String(req.body.customFieldDecision || '').toLowerCase();
      if (customHeaders.length && !['include', 'ignore'].includes(customFieldDecision)) {
        return res.json({
          status: 'customFieldsReview',
          message: 'Extra columns found. Review them before any records are written.',
          customColumns: customHeaders.map((header) => ({
            header,
            populatedRows: raw.filter((row) => row?.[header] !== undefined && row?.[header] !== null && String(row[header]).trim() !== '').length,
            sampleValues: raw.map((row) => row?.[header]).filter((value) => value !== undefined && value !== null && String(value).trim() !== '').slice(0, 3),
          })),
          totalRows: raw.length,
        });
      }

      const technicians = await scopedTechniciansForUser(req.user);
      const technicianMap = new Map(technicians.map(t => [t.username.toLowerCase(), t.mobile.toString()]));


      const validSchemes = [
        'MSEDCL Atal Solar Krushi Pump Yojana',
        'MEDA Atal Phase 1',
        'MEDA Atal Phase 2',
        'MSEDCL MSKPY T 1',
        'MSEDCL MSKPY T 2',
        'MSEDCL MSKPY T 3',
        'MSEDCL MSKPY T 4',
        'MEDA PM KUSUM Phase 1',
        'MEDA PM KUSUM Phase 2',
        'MEDA PM KUSUM Phase 3',
        'MEDA PM KUSUM Phase 4',
        'MEDA PM KUSUM Phase 5',
        'MSEDCL PM KUSUM T 1',
        'MSEDCL PM KUSUM T 2',
        'MSEDCL MTSKPY T1',
        'MEDA MTSKPY T1',
        ''
      ];

      const transformed = raw.map(r => {
        const obj = {};
        Object.keys(mapping).forEach(h => {
          if (r[h] != null) {
            const key = mapping[h];
            let val = dateFields.includes(h) ? toDate(r[h]) : r[h].toString().trim();
            if (key === 'scheme') {
              if (!validSchemes.includes(val)) {
                console.warn(`Invalid scheme "${val}" for Beneficiary ID ${r['Beneficiary ID']}, setting to empty`);
                val = '';
              }
            }
            if (key === 'sitePhotosUrls' || key === 'finalsitePhotosUrls') {
              val = val.split(',').map(s => s.trim()).filter(s => s);
            }
            obj[key] = val;
          }
        });

        // Handle panels array
        obj.panels = [];
        for (let i = 1; i <= 20; i++) {
          const panelKey = `Panel${i}`;
          if (r[panelKey] && r[panelKey].toString().trim()) {
            obj.panels.push(r[panelKey].toString().trim());
          }
        }

        const knownHeaders=new Set([...Object.keys(mapping),...Array.from({length:20},(_,i)=>`Panel${i+1}`)]);
        obj.customFields=customFieldDecision === 'ignore' ? {} : Object.fromEntries(Object.entries(r).filter(([k,v])=>!knownHeaders.has(k)&&v!==undefined&&v!==null&&String(v).trim()!=='').map(([k,v])=>[k,v]));
        obj.excelFileName = req.file.originalname;
        obj.excelUploadDate = new Date();

        const surveyorName = obj.surveyorName ? obj.surveyorName.toLowerCase() : null;
        const surveyorMobile = obj.surveyorMobile ? obj.surveyorMobile : null;

        console.log('Processing surveyor:', {
          rawSurveyorName: obj.surveyorName,
          rawSurveyorMobile: obj.surveyorMobile,
          normalizedSurveyorName: surveyorName,
          normalizedSurveyorMobile: surveyorMobile
        });

        if (surveyorName && surveyorMobile) {
          if (!technicianMap.has(surveyorName) || technicianMap.get(surveyorName) !== surveyorMobile) {
            console.warn('Invalid surveyor in Excel:', {
              surveyorName,
              surveyorMobile,
              expectedMobile: technicianMap.get(surveyorName) || 'N/A'
            });
            delete obj.surveyorName;
            delete obj.surveyorMobile;
          } else {
            const technician = technicians.find(t => t.username.toLowerCase() === surveyorName);
            obj.surveyorName = technician.username;
            obj.surveyorMobile = technician.mobile;
          }
        } else {
          console.log('Missing surveyor data, skipping:', { surveyorName, surveyorMobile });
          delete obj.surveyorName;
          delete obj.surveyorMobile;
        }

        for (const assignmentField of ['installationAssignedTechnician', 'reworkAssignTechnician']) {
          const username = String(obj[assignmentField] || '').trim().toLowerCase();
          if (!username) continue;
          const technician = technicians.find((t) => String(t.username || '').toLowerCase() === username);
          if (!technician) { delete obj[assignmentField]; if (assignmentField === 'installationAssignedTechnician') delete obj.installationAssignedTechnicianMobile; }
          else { obj[assignmentField] = technician.username; if (assignmentField === 'installationAssignedTechnician') obj.installationAssignedTechnicianMobile = String(technician.mobile || ''); }
        }

        return obj;
      });

      const duplicates = [], fresh = [];
      for (const row of transformed) {
        const exists = await Farmer.findOne({
          beneficiaryId: row.beneficiaryId,
          aadharNo: row.aadharNo,
          mobile: row.mobile
        });
        exists
          ? duplicates.push({ existing: exists, incoming: row })
          : fresh.push(row);
      }

      let decisions = req.body.decisions && JSON.parse(req.body.decisions);
      if (!decisions && duplicates.length) {
        return res.json({
          status: 'duplicatesFound',
          message: 'Duplicates found. Awaiting decisions.',
          duplicates: duplicates.map(d => { const fields=['beneficiaryName','aadharNo','mobile','alternateMobileNumber','scheme','village','taluka','district','pumpHP','surveyorName','surveyorMobile','installationAssignedTechnician','installationAssignedTechnicianMobile','reworkAssignTechnician']; return {
            beneficiaryId: d.incoming.beneficiaryId,
            beneficiaryName: d.incoming.beneficiaryName,
            aadharNo: d.incoming.aadharNo,
            mobile: d.incoming.mobile,
            existing: Object.fromEntries(fields.map(k=>[k,d.existing?.[k]??''])),
            incoming: Object.fromEntries(fields.map(k=>[k,d.incoming?.[k]??''])),
            differences: [
              ...fields.filter(k=>String(d.existing?.[k]??'')!==String(d.incoming?.[k]??'')).map(k=>({field:k,existing:d.existing?.[k]??'',incoming:d.incoming?.[k]??''})),
              ...Object.keys(d.incoming?.customFields || {}).filter(k=>String(d.existing?.customFields?.[k]??'')!==String(d.incoming.customFields[k]??'')).map(k=>({field:`Custom: ${k}`,existing:d.existing?.customFields?.[k]??'',incoming:d.incoming.customFields[k]??''}))
            ]
          }})
        });
      }

      const toSave = [...fresh];
      if (decisions) {
        for (const { existing, incoming } of duplicates) {
          if (decisions[incoming.beneficiaryId] !== 'update') continue;
          const merged = { ...existing.toObject(), ...incoming, customFields: { ...(existing.customFields || {}), ...(incoming.customFields || {}) } };
          if (keepInspection(existing.inspectionStatus)) {
            merged.inspectionStatus = existing.inspectionStatus;
            merged.applicationStatus = existing.applicationStatus;
            merged.inspectionStatusFinal = existing.inspectionStatusFinal;
          }
          const surveyorName = incoming.surveyorName ? incoming.surveyorName.toLowerCase() : null;
          const surveyorMobile = incoming.surveyorMobile ? incoming.surveyorMobile : null;
          if (surveyorName && surveyorMobile && technicianMap.has(surveyorName) && technicianMap.get(surveyorName) === surveyorMobile) {
            const technician = technicians.find(t => t.username.toLowerCase() === surveyorName);
            merged.surveyorName = technician.username;
            merged.surveyorMobile = technician.mobile;
          } else {
            merged.surveyorName = existing.surveyorName;
            merged.surveyorMobile = existing.surveyorMobile;
          }
          toSave.push(merged);
        }
      }

      if (toSave.length) {
        const ops = toSave.map(r => ({
          updateOne: {
            filter: { beneficiaryId: r.beneficiaryId },
            update: { $set: r },
            upsert: true
          }
        }));
        await Farmer.bulkWrite(ops);
      }

      return res.json({
        message: 'Excel processed successfully.',
        inserted: fresh.length,
        skipped: duplicates.length - (decisions
          ? Object.values(decisions).filter(v => v === 'update').length
          : 0)
      });
    } catch (err) {
      console.error('Error in uploadExcel:', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }
];

/* POST /uploadJsrExcel */
exports.uploadJsrExcel = [
  upload.single('excel'),
  async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: 'Excel file missing.' });

      const wb = xlsx.read(req.file.buffer, { type: 'buffer' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const raw = xlsx.utils.sheet_to_json(sheet).filter(r => r['Beneficiary ID']);

      const requiredColumns = ['Beneficiary ID', 'Beneficiary Name', 'Mobile', 'Aadhar No', 'JSR Status'];
      const headers = Object.keys(raw[0] || {});
      const missingColumns = requiredColumns.filter(col => !headers.includes(col));
      if (missingColumns.length > 0) {
        return res.status(400).json({
          message: `Missing required columns: ${missingColumns.join(', ')}`
        });
      }

      const validStatuses = [
        'JSR OUTCOME ACCEPTED',
        'JSR OUTCOME REJECTED',
        'JSR SUBMITTED',
        'JSR IN DISCREPANCY',
        'VENDOR INFORMATION RECEIVED'
      ];

      const validRecords = [];
      const invalidRecords = [];

      for (const row of raw) {
        const beneficiaryId = row['Beneficiary ID']?.toString().trim();
        const beneficiaryName = row['Beneficiary Name']?.toString().trim();
        const mobile = row['Mobile']?.toString().trim();
        const aadharNo = row['Aadhar No']?.toString().trim();
        const jsrStatus = row['JSR Status']?.toString().trim().toUpperCase();

        if (!beneficiaryId || !beneficiaryName || !mobile || !aadharNo || !jsrStatus) {
          invalidRecords.push({
            beneficiaryId: beneficiaryId || 'N/A',
            beneficiaryName: beneficiaryName || 'N/A',
            mobile: mobile || 'N/A',
            aadharNo: aadharNo || 'N/A',
            jsrStatus: jsrStatus || 'N/A',
            reason: 'Missing required fields'
          });
          continue;
        }

        if (!validStatuses.includes(jsrStatus)) {
          invalidRecords.push({
            beneficiaryId,
            beneficiaryName,
            mobile,
            aadharNo,
            jsrStatus,
            reason: 'Invalid JSR Status'
          });
          continue;
        }

        validRecords.push({
          beneficiaryId,
          beneficiaryName,
          mobile,
          aadharNo,
          jsrDeviationYesNo: jsrStatus  // Save status in existing field
        });
      }

      const updatedFarmers = [];
      const failedUpdates = [];

      for (const record of validRecords) {
        const farmer = await Farmer.findOne({
          beneficiaryId: record.beneficiaryId,
          beneficiaryName: record.beneficiaryName,
          mobile: record.mobile,
          aadharNo: record.aadharNo
        });

        if (farmer) {
          if (farmer.inspectionStatus !== 'Completed') {
            failedUpdates.push({
              ...record,
              reason: 'Inspection status is not Completed'
            });
            continue;
          }

          await Farmer.updateOne(
            { _id: farmer._id },
            {
              $set: {
                jsrDeviationYesNo: record.jsrDeviationYesNo  // Update existing field with status
              }
            }
          );
          updatedFarmers.push(record);
        } else {
          failedUpdates.push({
            ...record,
            reason: 'No matching farmer found'
          });
        }
      }

      return res.json({
        message: 'JSR Excel processed successfully.',
        updated: updatedFarmers.length,
        failed: failedUpdates.length,
        failedRecords: failedUpdates,
        invalidRecords
      });

    } catch (err) {
      console.error('Error in uploadJsrExcel:', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }
];

// GET /api/farmers/audit-logs
exports.getAuditLogs = async (req, res) => {
  try {
    const scope = await resolveAgencyScope(req.user);
    const query = scope.linked ? { $or: [
      { 'details.farmerId': { $in: scope.farmerIds } },
      { 'details.farmerIds': { $in: scope.farmerIds } },
    ] } : {};
    const logs = await AdminChangeLog.find(query).populate('adminId', 'username role').sort({ timestamp: -1 }).lean();
    res.status(200).json(logs);
  } catch (err) {
    console.error('Error in getAuditLogs:', err.message);
    res.status(500).json({ message: 'Failed to fetch audit logs' });
  }
};

// GET /api/farmers/users
exports.getUsers = async (req, res) => {
  try {
    const scope = await resolveAgencyScope(req.user);
    let query = {};
    if (scope.linked) {
      const AgencyUserLink = require('../models/platform/AgencyUserLink');
      const links = await AgencyUserLink.find({ agencyId: { $in: scope.agencyIds }, isActive: true }).select('legacyUserId').lean();
      query = { _id: { $in: links.map((x) => x.legacyUserId) } };
    }
    const users = await User.find(query).select('-password').lean();
    res.status(200).json(users);
  } catch (err) {
    console.error('Error in getUsers:', err.message);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};

// GET /api/farmers/change-requests
exports.getChangeRequests = async (req, res) => {
  try {
    const { adminId } = req.query;
    let query = {};

    if (adminId) {
      if (!mongoose.isValidObjectId(adminId)) {
        return res.status(400).json({ message: 'Invalid admin ID' });
      }
      query.requestedBy = adminId;
    }

    const requests = await TechnicianChangeRequest.find(query)
      .populate('farmerId', 'beneficiaryId beneficiaryName mobile aadharNo surveyorName surveyorMobile jsrTechnician installedByTechnicianName installationAssignedTechnician installationAssignedTechnicianMobile reworkAssignTechnician confirmedBy')
      .populate('requestedBy', 'username mobile role')
      .populate('approvedBy', 'username')
      .lean();
    const scopedRequests = [];
    for (const request of requests) {
      if (request.farmerId && await canAccessFarmer(req.user, request.farmerId)) scopedRequests.push(request);
    }
    res.status(200).json(scopedRequests);
  } catch (err) {
    console.error('Error in getChangeRequests:', err.message);
    res.status(500).json({ message: 'Failed to fetch change requests' });
  }
};

// POST /api/farmers/change-requests/:id/approve
exports.approveChangeRequest = async (req, res) => {
  try {
    const requestId = req.params.id;
    const user = req.user;

    if (user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Unauthorized to approve change requests' });
    }

    const request = await TechnicianChangeRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Change request not found' });
    }
    if (request.status !== 'Pending') {
      return res.status(400).json({ message: 'Change request is not pending' });
    }
    const requestFarmer = await Farmer.findById(request.farmerId).lean();
    if (!requestFarmer || !(await canAccessFarmer(user, requestFarmer))) {
      return res.status(403).json({ message: 'This change request is outside your agency scope.' });
    }

    // Apply the requested assignment without changing unrelated work owners.
    const assignmentType = request.assignmentType || 'SURVEY';
    const config = ASSIGNMENT_TYPES[assignmentType] || ASSIGNMENT_TYPES.SURVEY;
    const updateData = { [config.nameField]: request.newTechnician.username };
    if (config.mobileField) updateData[config.mobileField] = request.newTechnician.mobile;
    if (assignmentType === 'INSTALLATION') { updateData.installationAssignedAt = new Date(); updateData.installationAssignedBy = user._id; }
    if (assignmentType === 'REWORK') updateData.reworkAssignDate = new Date();

    await Farmer.findByIdAndUpdate(request.farmerId, {
      $set: updateData,
    });

    // Update request status
    request.status = 'Approved';
    request.approvedBy = user._id;
    request.approvedAt = new Date();
    await request.save({ validateBeforeSave: false }); // Bypass validation

    // Log the action
    await AdminChangeLog.create({
      adminId: user._id,
      changeType: 'technician_assignment',
      details: {
        farmerId: request.farmerId,
        changes: updateData,
        reason: `Approved technician change request ${requestId}`,
      },
    });

    res.status(200).json({ message: 'Change request approved successfully' });
  } catch (err) {
    console.error('Error in approveChangeRequest:', err.message);
    res.status(500).json({ message: 'Failed to approve change request' });
  }
};

// POST /api/farmers/change-requests/:id/reject
exports.rejectChangeRequest = async (req, res) => {
  try {
    const requestId = req.params.id;
    const user = req.user;

    if (user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Unauthorized to reject change requests' });
    }

    const request = await TechnicianChangeRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Change request not found' });
    }
    if (request.status !== 'Pending') {
      return res.status(400).json({ message: 'Change request is not pending' });
    }

    // Update request status
    request.status = 'Rejected';
    request.approvedBy = user._id;
    request.approvedAt = new Date();
    await request.save({ validateBeforeSave: false }); // Bypass validation

    // Log the action
    await AdminChangeLog.create({
      adminId: user._id,
      changeType: 'technician_assignment',
      details: {
        farmerId: request.farmerId,
        reason: `Rejected technician change request ${requestId}`,
      },
    });

    res.status(200).json({ message: 'Change request rejected successfully' });
  } catch (err) {
    console.error('Error in rejectChangeRequest:', err.message);
    res.status(500).json({ message: 'Failed to reject change request' });
  }
};

// GET /api/requests
exports.getRequests = async (req, res) => {
  try {
    // Restrict to superadmin only
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Unauthorized access to requests' });
    }

    // Fetch all pending technician change requests
    const requests = await TechnicianChangeRequest.find({ status: 'Pending' })
      .populate('farmerId', 'beneficiaryId beneficiaryName')
      .populate('requestedBy', 'username')
      .lean();

    // Format the response for the frontend
    const allowedRequests = [];
    for (const request of requests) {
      if (request.farmerId && await canAccessFarmer(req.user, request.farmerId)) allowedRequests.push(request);
    }
    const formattedRequests = allowedRequests.map((req) => ({
      requestId: req._id,
      requestedBy: req.requestedBy.username,
      requestType: 'technician_change',
      details: `${String(req.assignmentType || 'SURVEY').replaceAll('_',' ')} assignment for farmer ${req.farmerId.beneficiaryId} - ${req.farmerId.beneficiaryName}`,
      status: req.status,
      createdAt: req.requestDate,
      remarks: req.remarks || '',
    }));

    res.status(200).json(formattedRequests);
  } catch (err) {
    console.error('Error in getRequests:', err.message);
    res.status(500).json({ message: 'Failed to fetch requests' });
  }
};

// GET /api/farmers/requests
exports.getAllRequests = async (req, res) => {
  try {
    // Restrict to superadmin only
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Unauthorized access to requests' });
    }

    // Fetch all pending technician change requests
    const requests = await TechnicianChangeRequest.find({ status: 'Pending' })
      .populate('farmerId', 'beneficiaryId beneficiaryName')
      .populate('requestedBy', 'username')
      .lean();

    // Format the response to match frontend expectations
    const allowedRequests = [];
    for (const request of requests) {
      if (request.farmerId && await canAccessFarmer(req.user, request.farmerId)) allowedRequests.push(request);
    }
    const formattedRequests = allowedRequests.map((req) => ({
      requestId: req._id.toString(),
      requestedBy: req.requestedBy?.username || 'Unknown',
      requestType: 'technician_change',
      details: `${String(req.assignmentType || 'SURVEY').replaceAll('_',' ')} assignment for farmer ${req.farmerId?.beneficiaryId || 'N/A'} - ${req.farmerId?.beneficiaryName || 'N/A'}`,
      status: req.status,
      createdAt: req.requestDate,
      remarks: req.remarks || '',
    }));

    res.status(200).json(formattedRequests);
  } catch (err) {
    console.error('Error in getAllRequests:', err.message);
    res.status(500).json({ message: 'Failed to fetch requests' });
  }
};
// GET /api/farmers/detail-context/:id
// Agency-authenticated enrichment for the Farmer Detail workspace. The existing
// Farmer record remains the source of truth; this adds Opsynq company/work-package,
// installed asset, material issue, service and compliance context when available.
exports.getFarmerDetailContext = async (req, res) => {
  try {
    const BeneficiaryContext = require('../models/platform/BeneficiaryContext');
    const InstalledAsset = require('../models/platform/InstalledAsset');
    const MaterialIssue = require('../models/platform/MaterialIssue');
    const ServiceCase = require('../models/platform/ServiceCase');
    const ComplianceRecord = require('../models/platform/ComplianceRecord');
    const AgencyUserLink = require('../models/platform/AgencyUserLink');
    const EvidenceRequirement = require('../models/platform/EvidenceRequirement');
    const EvidenceSubmission = require('../models/platform/EvidenceSubmission');
    const { materialReconciliation } = require('../utils/inventoryTrace');

    const farmer = await Farmer.findById(req.params.id).lean();
    if (!farmer) return res.status(404).json({ message: 'Farmer not found.' });
    if (!(await canAccessFarmer(req.user, farmer))) return res.status(403).json({ message: 'You do not have access to this beneficiary.' });

    const context = await BeneficiaryContext.findOne({ farmerId: farmer._id })
      .populate('companyId', 'name code contact address')
      .populate('programId', 'name code authority scheme component financialYear status')
      .populate('workOrderId', 'number title status dueDate')
      .populate('workPackageId', 'code name status dueDate geography assignedQuantity')
      .populate('agencyId', 'name code contact address')
      .populate('assignedByPlatformUserId', 'name email mobile role')
      .populate({ path: 'sourceImportBatchId', select: 'sourceFileName status createdAt uploadedBy', populate: { path: 'uploadedBy', select: 'name email mobile role' } })
      .lean();

    // If this farmer belongs to an Opsynq mapped agency, make sure a linked agency
    // user cannot inspect another agency's mapped beneficiary. Legacy unmapped
    // deployments keep their existing behavior for backward compatibility.
    if (context?.agencyId?._id) {
      const link = await AgencyUserLink.findOne({ legacyUserId: req.user._id, isActive: true }).lean();
      if (link && String(link.agencyId) !== String(context.agencyId._id)) {
        return res.status(403).json({ message: 'This beneficiary is assigned to another agency.' });
      }
    }

    const [assets, issues, serviceCases, compliance, evidenceRequirements, evidenceSubmissions] = await Promise.all([
      InstalledAsset.find({ farmerId: farmer._id })
        .populate('itemId', 'sku name category brand model installationRole')
        .populate('inventorySerialId', 'serialNumber barcodeValue status')
        .populate('technicianUserId', 'username mobile role')
        .sort({ installedAt: -1 }).lean(),
      MaterialIssue.find({ farmerId: farmer._id })
        .populate('items.itemId', 'sku name category')
        .populate('items.serialIds', 'serialNumber barcodeValue status')
        .populate('technicianUserId', 'username mobile')
        .sort({ issuedAt: -1 }).lean(),
      ServiceCase.find({ farmerId: farmer._id })
        .populate('installedAssetId', 'serialNumber assetRole status')
        .populate('assignedToLegacyUser', 'username mobile role')
        .sort({ openedAt: -1 }).lean(),
      ComplianceRecord.find({ farmerId: farmer._id })
        .sort({ createdAt: -1 }).lean(),
      context?.companyId?._id ? EvidenceRequirement.find({companyId:context.companyId._id,isActive:true,$or:[{programId:null},{programId:context.programId?._id||context.programId}]}).sort({stage:1,sortOrder:1}).lean() : [],
      context?.companyId?._id ? EvidenceSubmission.find({companyId:context.companyId._id,farmerId:farmer._id}).lean() : [],
    ]);

    const reconciliation = context?.companyId?._id ? await materialReconciliation({ companyId: context.companyId._id, farmerId: farmer._id, agencyId: context.agencyId?._id || context.agencyId }) : null;

    const submissionByReq=new Map((evidenceSubmissions||[]).map(x=>[String(x.requirementId),x]));
    const evidenceChecklist=(evidenceRequirements||[]).map(r=>({requirement:r,submission:submissionByReq.get(String(r._id))||null}));
    const directAssigner=context?.assignedByPlatformUserId||null;
    const importAssigner=context?.sourceImportBatchId?.uploadedBy||null;
    const assignedBy=directAssigner||importAssigner||null;
    res.json({
      context: context ? {...context,assignmentAttribution:{
        name: context.assignedByName || assignedBy?.name || assignedBy?.email || assignedBy?.mobile || '',
        role: context.assignedByRole || assignedBy?.role || '',
        source: directAssigner ? 'ASSIGNMENT' : importAssigner ? 'IMPORT' : 'LEGACY',
        assignedAt: context.assignedAt || context.sourceImportBatchId?.createdAt || context.createdAt || null,
      }} : null,
      assets,
      materialIssues: issues,
      serviceCases,
      compliance,
      evidenceChecklist,
      materialReconciliation: reconciliation,
    });
  } catch (err) {
    console.error('Error in getFarmerDetailContext:', err);
    res.status(500).json({ message: 'Failed to load beneficiary operational context.' });
  }
};


exports.submitFarmerEvidence = async (req,res)=>{
  try{
    const BeneficiaryContext=require('../models/platform/BeneficiaryContext');
    const AgencyUserLink=require('../models/platform/AgencyUserLink');
    const EvidenceRequirement=require('../models/platform/EvidenceRequirement');
    const EvidenceSubmission=require('../models/platform/EvidenceSubmission');
    const farmer=await Farmer.findById(req.params.id).lean();
    if(!farmer)return res.status(404).json({message:'Farmer not found.'});
    if(!(await canAccessFarmer(req.user,farmer)))return res.status(403).json({message:'You do not have access to this beneficiary.'});
    const context=await BeneficiaryContext.findOne({farmerId:farmer._id}).lean();
    if(!context)return res.status(400).json({message:'This beneficiary is not mapped to an Opsynq company/work package.'});
    const link=await AgencyUserLink.findOne({legacyUserId:req.user._id,isActive:true}).lean();
    if(link&&String(link.agencyId)!==String(context.agencyId))return res.status(403).json({message:'This beneficiary is assigned to another agency.'});
    const requirement=await EvidenceRequirement.findOne({_id:req.params.requirementId,companyId:context.companyId,isActive:true}).lean();
    if(!requirement)return res.status(404).json({message:'Evidence requirement not found.'});
    const rawGeo=req.body.geo&&typeof req.body.geo==='object'?req.body.geo:{};
    const validGeo=Number.isFinite(Number(rawGeo.latitude))&&Number.isFinite(Number(rawGeo.longitude));
    const captureGeo=validGeo?{latitude:Number(rawGeo.latitude),longitude:Number(rawGeo.longitude),accuracy:Math.max(0,Number(rawGeo.accuracy||0)),address:String(rawGeo.address||'').slice(0,500),capturedAt:rawGeo.capturedAt?new Date(rawGeo.capturedAt):new Date(),source:'DEVICE',capturedByUserId:req.user._id,capturedByName:req.user.username||req.user.mobile,capturedByRole:req.user.role}:undefined;
    const files=Array.isArray(req.body.files)?req.body.files.filter(x=>x&&x.url).map(x=>({url:String(x.url),name:String(x.name||''),mimeType:String(x.mimeType||'image/jpeg'),geo:captureGeo})):[];
    if(requirement.required&&['PHOTO','DOCUMENT','SIGNATURE'].includes(requirement.evidenceType)&&files.length<Number(requirement.minFiles||1))return res.status(400).json({message:`At least ${requirement.minFiles||1} file(s) are required.`});
    const item=await EvidenceSubmission.findOneAndUpdate(
      {companyId:context.companyId,farmerId:farmer._id,requirementId:requirement._id},
      {$set:{workPackageId:context.workPackageId,agencyId:context.agencyId,stage:requirement.stage,status:'SUBMITTED',files,value:req.body.value,notes:req.body.notes||'',captureGeo,submittedByLegacyUser:req.user._id,verifiedBy:null,verifiedAt:null}},
      {upsert:true,new:true,setDefaultsOnInsert:true}
    );
    try{const AuditLog=require('../models/platform/AuditLog');await AuditLog.create({companyId:context.companyId,organizationId:context.agencyId,actorId:req.user._id,actorType:'User',action:'FIELD_EVIDENCE_SUBMITTED',entityType:'Farmer',entityId:farmer._id,after:{stage:requirement.stage,requirement:requirement.label,fileCount:files.length,geo:captureGeo||null}})}catch(auditErr){console.error('Evidence audit failed:',auditErr.message)}
    res.status(201).json({item});
  }catch(err){console.error('Error in submitFarmerEvidence:',err);res.status(500).json({message:'Failed to submit evidence.'});}
};
