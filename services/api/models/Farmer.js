const mongoose = require('mongoose');

const farmerSchema = new mongoose.Schema({
  beneficiaryId: String,
  beneficiaryName: String,
  mobile: String,
  alternateMobileNumber: String,
  aadharNo: String,
  scheme: {
    type: String,
    enum: [
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
    ],
    default: ''
  },
  casteCategory: String,
  landAddress: String,
  village: String,
  taluka: String,
  district: String,
  divisionName: String,
  circleName: String,
  zoneName: String,

  // ─── VERIFICATION FIELDS ─────────────────────────────────────────────
  siteDepth: { type: String, default: '' },
  inspectionStatus: { type: String, default: 'Pending', enum: ['Pending', 'In Progress', 'Completed'] },
  applicationStatus: {
    type: String,
    enum: [
      'Pending',
      'Pending Installation',
      'Move to Installation',
      'Ordered',
      'Dispatch Completed',
      'Ready for Installation',
      'Installation Completed',
      'Complaint Raised',
      'Closed',
    ],
    default: 'Pending',
  },
  siteLocation: { type: String, default: '' },

  pumpType: String,
  pumpHP: String,
  controllerTypeWithOrWithout: String,

  assignedVendorCompanyName: String,
  vendorAssignmentDate: Date,

  surveyorName: String,
  surveyorMobile: String,

  sourceType: String,
  landHoldingAcre: String,
  landOwnershipType: String,
  actualHeadM: String,
  sourceDepthFeet: String,
  jsrDeviationYesNo: {
    type: String,
    enum: [
      'JSR OUTCOME ACCEPTED',
      'JSR OUTCOME REJECTED',
      'JSR SUBMITTED',
      'JSR IN DISCREPANCY',
      'VENDOR INFORMATION RECEIVED',
      ''
    ],
    default: ''
  },
  inspectionStatusFinal: {
    type: String,
    enum: [
      'Blocked for further process because PP consumer number of other consumer used',
      'VENDOR INFORMATION RECEIVED',
      'Refund Process Completed and Amount transferred to Beneficiary',
      'PUMP INSTALLATION DETAILS RECEIVED FROM VENDOR',
      'PUMP INSTALLATION INSPECTION DONE BY LINEMAN',
      'SYSTEM DETAILS SUBMITTED',
      ''
    ],
    default: ''
  },
    deviationRemarks: String,

  surveyDate: Date,
  jsrTechnician: String,

  materialOnSiteOrWarehouse: { type: String, enum: ['On Site', 'Warehouse', ''], default: '' }, // Added enum
  warehouseInwardDate: Date,
  vehicleNo: String,

  lotNo: String,
  fullSetOrPartialSet: String,
  invoiceNo: String,
  waybillNoFromCompany: String,
  lot: String,
  materialDispatchDate: Date,

  transporterName: String,
  transporterVehicleNo: String,

  materialReceivedConfirmationYesNo: { type: String, enum: ['Yes', 'No', ''], default: '' }, // Added enum
  shortageDamagedRemarks: String,

  invoiceDate: Date,
  waybillNo: String,
  deliveryChallanNo: String,

  installationDate: Date,
  installationCompletionDate: Date,
  installedByTechnicianName: String,
  commissioningDate: Date,

  installedPhotoUpload: String,
  panels: [{ type: String }],

  pumpNoUnique: String,
  motorNoUnique: String,
  controllerNoUnique: String,
  imeiNoUnique: String,

  billSubmittedToVendorYesNo: String,
  invoiceNoOfBillVendor: String,
  rateVendor: String,
  paymentReceivedAmount: String,
  paymentReceivedDate: Date,

  assignedToCRMExecutiveAdmin: String,
  materialPartiallyDispatchDate: Date,
  materialCompletelyDispatchDate: Date,

  installationDoneYesNo: { type: String, enum: ['Yes', 'No', ''], default: '' },
  pumpNotOperatingYesNo: { type: String, enum: ['Yes', 'No', ''], default: '' },
  companyAssignedPersonName: String,

  // ─── COMPLAINT FIELDS ────────────────────────────────────────────────
  complaintIssue: { type: String, default: '' },
  complaintRaisedDate: { type: Date, default: null },
  complaintNumber: { type: String, default: '' },
  complaintRaisedByName: { type: String, default: '' },
  complaintRaisedById: { type: String, default: '' },
  complaintStatus: { type: String, enum: ['Open', 'In Progress', 'Resolved', ''], default: '' },

  subcontractorRate: String,
  subcontractorBill: String,
  paymentGivenToSubcontractor: String,
  paymentPending: String,

  ourBillReceived: String,
  ourBillPending: String,

  reWork: String,
  issues: String,
  reworkAssignTechnician: String,
  reworkAssignDate: Date,
  solutionDate: Date,
  chargesToDebit: String,

  // ─── UPLOAD URLS ─────────────────────────────────────────────────────
  farmerPhotoUrl: String,
  sitePhotosUrls: [String],
  signatureUrl: String,

  // ─── FINAL UPLOAD URLS ───────────────────────────────────────────────
  finalfarmerPhotoUrl: String,
  finalsitePhotosUrls: [String],
  finalsignatureUrl: String,
  finalsurveyorsignatureUrl: String,

  excelFileName: String,
  excelUploadDate: Date,

  // ─── NEW FIELDS FOR ORDER CONFIRMATION ───────────────────────────────
  orderReceivedByTechnician: String,
  orderReceivedConfirmationYesNo: { type: String, enum: ['Yes', 'No', ''], default: '' },
  orderReceivedDate: Date,
  orderReceivedRemarks: String,
  orderReceivedYesNo: { type: String, enum: ['Yes', 'No', ''], default: '' },
  materialReceivedDate: { type: Date, default: null },

  remarks: { type: String, default: '' },                // Added for additional remarks
  confirmedBy: { type: String, default: '' },            // Added for technician username
  confirmationDate: { type: Date, default: null },       // Added for confirmation timestamp
  lrPhotoUrls: [{ type: String, default: '' }],          // Added for LR photos
  customFields: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

// Simplified pre('save') hook to avoid interference
farmerSchema.pre('save', function (next) {
  if (this.applicationStatus === 'Complaint Raised' && !this.complaintStatus) {
    this.complaintStatus = 'Open';
  }
  next();
});

// Indexes for better query performance
farmerSchema.index({ complaintNumber: 1 });
farmerSchema.index({ complaintRaisedDate: 1 });
farmerSchema.index({ applicationStatus: 1 });
farmerSchema.index({ surveyorMobile: 1 });
farmerSchema.index({ district: 1, taluka: 1, village: 1 });
farmerSchema.index({ scheme: 1, applicationStatus: 1, inspectionStatus: 1 });
farmerSchema.index({ beneficiaryId: 1 });
farmerSchema.index({ mobile: 1 });

module.exports = mongoose.model('Farmer', farmerSchema);
