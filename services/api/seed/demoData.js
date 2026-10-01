const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const connectDB = require('../config/db');

const Organization = require('../models/platform/Organization');
const PlatformUser = require('../models/platform/PlatformUser');
const Program = require('../models/platform/Program');
const Contract = require('../models/platform/Contract');
const WorkOrder = require('../models/platform/WorkOrder');
const WorkPackage = require('../models/platform/WorkPackage');
const BeneficiaryContext = require('../models/platform/BeneficiaryContext');
const ImportBatch = require('../models/platform/ImportBatch');
const ItemMaster = require('../models/platform/ItemMaster');
const Warehouse = require('../models/platform/Warehouse');
const InventorySerial = require('../models/platform/InventorySerial');
const InventoryBalance = require('../models/platform/InventoryBalance');
const PurchaseOrder = require('../models/platform/PurchaseOrder');
const GoodsReceipt = require('../models/platform/GoodsReceipt');
const StockMovement = require('../models/platform/StockMovement');
const Driver = require('../models/platform/Driver');
const Vehicle = require('../models/platform/Vehicle');
const Shipment = require('../models/platform/Shipment');
const TrackingEvent = require('../models/platform/TrackingEvent');
const MaterialIssue = require('../models/platform/MaterialIssue');
const InstalledAsset = require('../models/platform/InstalledAsset');
const AssetServicePlan = require('../models/platform/AssetServicePlan');
const ServiceCase = require('../models/platform/ServiceCase');
const CommercialClaim = require('../models/platform/CommercialClaim');
const ComplianceRecord = require('../models/platform/ComplianceRecord');
const ApprovalRequest = require('../models/platform/ApprovalRequest');
const Notification = require('../models/platform/Notification');
const DocumentRecord = require('../models/platform/DocumentRecord');
const AgencyUserLink = require('../models/platform/AgencyUserLink');
const SLARule = require('../models/platform/SLARule');
const ReplenishmentPlan = require('../models/platform/ReplenishmentPlan');
const AuditLog = require('../models/platform/AuditLog');
const MasterDataEntry = require('../models/platform/MasterDataEntry');
const EvidenceRequirement = require('../models/platform/EvidenceRequirement');
const EvidenceSubmission = require('../models/platform/EvidenceSubmission');
const InsurancePolicy = require('../models/platform/InsurancePolicy');
const PDIRecord = require('../models/platform/PDIRecord');
const Farmer = require('../models/Farmer');
const User = require('../models/User');

const DEMO_MEDIA_BASE_URL = String(process.env.DEMO_MEDIA_BASE_URL || '').replace(/\/$/, '');
const DEMO_PASSWORD = process.env.DEMO_DEFAULT_PASSWORD || 'Demo@1234';

const media = (name) => `${DEMO_MEDIA_BASE_URL}/demo-media/${name}`;
const daysFromNow = (days) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);
const daysAgo = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);
const money = (n) => Math.round(n * 100) / 100;
const geo = (latitude, longitude, address) => ({ latitude, longitude, accuracy: 10, address, capturedAt: new Date(), updatedAt: new Date() });

const DEMO_PLATFORM_USERS = [
  { key: 'c1_owner', name: 'Rohan Kulkarni', email: 'rohan.kulkarni@opsynq.demo', mobile: '9000000001', role: 'company_owner' },
  { key: 'c1_admin', name: 'Megha Sharma', email: 'megha.sharma@opsynq.demo', mobile: '9000000002', role: 'company_admin' },
  { key: 'c1_ops', name: 'Aniket Joshi', email: 'aniket.joshi@opsynq.demo', mobile: '9000000003', role: 'operations_manager' },
  { key: 'c1_inventory', name: 'Kavita Patil', email: 'kavita.patil@opsynq.demo', mobile: '9000000004', role: 'inventory_manager' },
  { key: 'c1_logistics', name: 'Sameer Khan', email: 'sameer.khan@opsynq.demo', mobile: '9000000005', role: 'logistics_manager' },
  { key: 'c1_quality', name: 'Neha Deshmukh', email: 'neha.deshmukh@opsynq.demo', mobile: '9000000006', role: 'quality_user' },
  { key: 'c1_finance', name: 'Vikram Naik', email: 'vikram.naik@opsynq.demo', mobile: '9000000007', role: 'finance_user' },
  { key: 'c1_viewer', name: 'Prerna Sable', email: 'prerna.sable@opsynq.demo', mobile: '9000000008', role: 'viewer' },
  { key: 'c2_owner', name: 'Sanjay Borse', email: 'sanjay.borse@opsynq.demo', mobile: '9100000001', role: 'company_owner' },
  { key: 'c2_admin', name: 'Pooja More', email: 'pooja.more@opsynq.demo', mobile: '9100000002', role: 'company_admin' },
  { key: 'c2_ops', name: 'Harshal Jadhav', email: 'harshal.jadhav@opsynq.demo', mobile: '9100000003', role: 'operations_manager' },
  { key: 'c2_inventory', name: 'Nitin Kale', email: 'nitin.kale@opsynq.demo', mobile: '9100000004', role: 'inventory_manager' },
  { key: 'c2_quality', name: 'Manasi Pawar', email: 'manasi.pawar@opsynq.demo', mobile: '9100000005', role: 'quality_user' },
];

const DEMO_AGENCY_USERS = [
  { key: 'nagpur_superadmin', username: 'nagpur.superadmin', email: 'nagpur.superadmin@opsynq.demo', mobile: '9200000001', role: 'superadmin' },
  { key: 'nagpur_admin', username: 'nagpur.admin', email: 'nagpur.admin@opsynq.demo', mobile: '9200000002', role: 'admin' },
  { key: 'nagpur_tech_1', username: 'nagpur.tech01', email: 'nagpur.tech01@opsynq.demo', mobile: '9200000003', role: 'field_technician' },
  { key: 'nagpur_tech_2', username: 'nagpur.tech02', email: 'nagpur.tech02@opsynq.demo', mobile: '9200000004', role: 'field_technician' },
  { key: 'nashik_superadmin', username: 'nashik.superadmin', email: 'nashik.superadmin@opsynq.demo', mobile: '9300000001', role: 'superadmin' },
  { key: 'nashik_admin', username: 'nashik.admin', email: 'nashik.admin@opsynq.demo', mobile: '9300000002', role: 'admin' },
  { key: 'nashik_tech_1', username: 'nashik.tech01', email: 'nashik.tech01@opsynq.demo', mobile: '9300000003', role: 'field_technician' },
  { key: 'nashik_tech_2', username: 'nashik.tech02', email: 'nashik.tech02@opsynq.demo', mobile: '9300000004', role: 'field_technician' },
  { key: 'pune_superadmin', username: 'pune.superadmin', email: 'pune.superadmin@opsynq.demo', mobile: '9400000001', role: 'superadmin' },
  { key: 'pune_admin', username: 'pune.admin', email: 'pune.admin@opsynq.demo', mobile: '9400000002', role: 'admin' },
  { key: 'pune_tech_1', username: 'pune.tech01', email: 'pune.tech01@opsynq.demo', mobile: '9400000003', role: 'field_technician' },
];

async function upsertOrganization(payload) {
  return Organization.findOneAndUpdate(
    { code: payload.code },
    { $set: payload },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

async function upsertPlatformUser(payload) {
  const hashed = await bcrypt.hash(payload.password || DEMO_PASSWORD, 12);
  return PlatformUser.findOneAndUpdate(
    { mobile: payload.mobile },
    {
      $set: {
        name: payload.name,
        email: payload.email?.toLowerCase(),
        mobile: payload.mobile,
        password: hashed,
        role: payload.role,
        organizationId: payload.organizationId,
        approvalStatus: 'APPROVED',
        isActive: true,
        lastLocation: payload.lastLocation || undefined,
        lastLoginAt: daysAgo(1),
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

async function upsertLegacyUser(payload) {
  const hashed = await bcrypt.hash(payload.password || DEMO_PASSWORD, 12);
  return User.findOneAndUpdate(
    { mobile: payload.mobile },
    {
      $set: {
        username: payload.username,
        email: payload.email,
        mobile: payload.mobile,
        password: hashed,
        role: payload.role,
        isActive: true,
        lastLocation: payload.lastLocation || undefined,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

async function clearDemoData(companyIds) {
  const companyFilter = { companyId: { $in: companyIds } };
  const companyScopedModels = [
    Program,
    Contract,
    WorkOrder,
    WorkPackage,
    BeneficiaryContext,
    ImportBatch,
    ItemMaster,
    Warehouse,
    InventorySerial,
    InventoryBalance,
    PurchaseOrder,
    GoodsReceipt,
    StockMovement,
    Driver,
    Vehicle,
    Shipment,
    TrackingEvent,
    MaterialIssue,
    InstalledAsset,
    AssetServicePlan,
    ServiceCase,
    CommercialClaim,
    ComplianceRecord,
    ApprovalRequest,
    Notification,
    DocumentRecord,
    AgencyUserLink,
    SLARule,
    MasterDataEntry,
    EvidenceRequirement,
    EvidenceSubmission,
    InsurancePolicy,
    PDIRecord,
    AuditLog,
  ];
  for (const Model of companyScopedModels) {
    await Model.deleteMany(companyFilter);
  }
  await Farmer.deleteMany({ beneficiaryId: /^OPS-DM-/ });
}

(async () => {
  try {
    await connectDB();

    let platformOrg = await Organization.findOne({ type: 'PLATFORM', code: 'OPSYNQ' });
    if (!platformOrg) {
      platformOrg = await Organization.create({
        name: 'Opsynq Platform',
        code: 'OPSYNQ',
        type: 'PLATFORM',
        status: 'ACTIVE',
        country: 'Global',
        metadata: { product: 'Opsynq', phase: 19 },
      });
    }

    const companyOne = await upsertOrganization({
      name: 'SuryaKisan Energy Private Limited',
      code: 'SKEPL',
      type: 'COMPANY',
      parentOrganization: platformOrg._id,
      country: 'India',
      state: 'Maharashtra',
      status: 'ACTIVE',
      contact: { name: 'Rohan Kulkarni', email: 'rohan.kulkarni@opsynq.demo', mobile: '9000000001' },
      address: { line1: 'IT Park Road', city: 'Nagpur', district: 'Nagpur', state: 'Maharashtra', country: 'India', pincode: '440022' },
      metadata: { theme: 'demo', segment: 'solar-irrigation' },
    });

    const companyTwo = await upsertOrganization({
      name: 'AgriVolt Solar Infra Limited',
      code: 'AVSIL',
      type: 'COMPANY',
      parentOrganization: platformOrg._id,
      country: 'India',
      state: 'Maharashtra',
      status: 'ACTIVE',
      contact: { name: 'Sanjay Borse', email: 'sanjay.borse@opsynq.demo', mobile: '9100000001' },
      address: { line1: 'Baner Link Road', city: 'Pune', district: 'Pune', state: 'Maharashtra', country: 'India', pincode: '411045' },
      metadata: { theme: 'demo', segment: 'distributed-energy' },
    });

    const nagpurAgency = await upsertOrganization({
      name: 'Nagpur Field Ops Agency',
      code: 'NAGFOPS',
      type: 'AGENCY',
      parentOrganization: companyOne._id,
      country: 'India',
      state: 'Maharashtra',
      status: 'ACTIVE',
      contact: { name: 'Prashant Wankhede', email: 'nagpur.agency@opsynq.demo', mobile: '9200000001' },
      address: { line1: 'Hingna MIDC', city: 'Nagpur', district: 'Nagpur', state: 'Maharashtra', country: 'India', pincode: '440016' },
      metadata: { demo: true },
    });

    const nashikAgency = await upsertOrganization({
      name: 'Nashik Rural Installations',
      code: 'NASRINS',
      type: 'AGENCY',
      parentOrganization: companyOne._id,
      country: 'India',
      state: 'Maharashtra',
      status: 'ACTIVE',
      contact: { name: 'Sachin Mahajan', email: 'nashik.agency@opsynq.demo', mobile: '9300000001' },
      address: { line1: 'Satpur Road', city: 'Nashik', district: 'Nashik', state: 'Maharashtra', country: 'India', pincode: '422007' },
      metadata: { demo: true },
    });

    const puneAgency = await upsertOrganization({
      name: 'Pune Energy Services',
      code: 'PUNESVC',
      type: 'AGENCY',
      parentOrganization: companyTwo._id,
      country: 'India',
      state: 'Maharashtra',
      status: 'ACTIVE',
      contact: { name: 'Nilesh Patne', email: 'pune.agency@opsynq.demo', mobile: '9400000001' },
      address: { line1: 'Hadapsar Industrial Estate', city: 'Pune', district: 'Pune', state: 'Maharashtra', country: 'India', pincode: '411028' },
      metadata: { demo: true },
    });

    await clearDemoData([companyOne._id, companyTwo._id]);

    const companyUsers = {};
    for (const definition of DEMO_PLATFORM_USERS) {
      const organizationId = definition.key.startsWith('c1_') ? companyOne._id : companyTwo._id;
      const lastLocation = definition.key.startsWith('c1_')
        ? geo(21.1458, 79.0882, 'Nagpur HQ')
        : geo(18.5204, 73.8567, 'Pune HQ');
      companyUsers[definition.key] = await upsertPlatformUser({ ...definition, organizationId, lastLocation });
    }

    const agencyUsers = {};
    for (const definition of DEMO_AGENCY_USERS) {
      let lastLocation = geo(21.1458, 79.0882, 'Nagpur district');
      if (definition.key.startsWith('nashik_')) lastLocation = geo(20.0110, 73.7903, 'Nashik district');
      if (definition.key.startsWith('pune_')) lastLocation = geo(18.5204, 73.8567, 'Pune district');
      agencyUsers[definition.key] = await upsertLegacyUser({ ...definition, lastLocation });
    }

    const agencyLinks = [
      [nagpurAgency, 'nagpur_superadmin'], [nagpurAgency, 'nagpur_admin'], [nagpurAgency, 'nagpur_tech_1'], [nagpurAgency, 'nagpur_tech_2'],
      [nashikAgency, 'nashik_superadmin'], [nashikAgency, 'nashik_admin'], [nashikAgency, 'nashik_tech_1'], [nashikAgency, 'nashik_tech_2'],
      [puneAgency, 'pune_superadmin'], [puneAgency, 'pune_admin'], [puneAgency, 'pune_tech_1'],
    ];
    for (const [agency, userKey] of agencyLinks) {
      const companyId = String(agency.parentOrganization) === String(companyTwo._id) ? companyTwo._id : companyOne._id;
      await AgencyUserLink.create({
        companyId,
        agencyId: agency._id,
        legacyUserId: agencyUsers[userKey]._id,
        role: agencyUsers[userKey].role,
        isActive: true,
        linkedBy: companyId.equals(companyOne._id) ? companyUsers.c1_admin._id : companyUsers.c2_admin._id,
      });
    }

    const programs = await Program.insertMany([
      {
        companyId: companyOne._id,
        name: 'PM-KUSUM Demo Maharashtra 2026',
        code: 'PMK-2026-MH',
        country: 'India',
        state: 'Maharashtra',
        authority: 'State Renewable Demo Authority',
        scheme: 'PM-KUSUM',
        component: 'Solar Irrigation Pumps',
        financialYear: '2026-27',
        sanctionedQuantity: 500,
        contractValue: 185000000,
        status: 'ACTIVE',
        startDate: daysAgo(90),
        endDate: daysFromNow(240),
      },
      {
        companyId: companyTwo._id,
        name: 'AgriVolt Rural Water Program',
        code: 'AV-RWP-2026',
        country: 'India',
        state: 'Maharashtra',
        authority: 'Distributed Energy Demo Board',
        scheme: 'Rural Water Solarization',
        component: 'Community Pump Sets',
        financialYear: '2026-27',
        sanctionedQuantity: 250,
        contractValue: 96000000,
        status: 'ACTIVE',
        startDate: daysAgo(60),
        endDate: daysFromNow(300),
      },
    ]);
    const programOne = programs[0];
    const programTwo = programs[1];

    const contracts = await Contract.insertMany([
      {
        companyId: companyOne._id,
        programId: programOne._id,
        type: 'LOA',
        number: 'SKEPL/PMK/2026/001',
        title: 'Lot A - Solar Irrigation Deployment Maharashtra',
        authority: 'State Renewable Demo Authority',
        sanctionedQuantity: 500,
        contractValue: 185000000,
        awardDate: daysAgo(100),
        startDate: daysAgo(90),
        endDate: daysFromNow(240),
        status: 'ACTIVE',
      },
      {
        companyId: companyTwo._id,
        programId: programTwo._id,
        type: 'CONTRACT',
        number: 'AVSIL/RWP/2026/004',
        title: 'Rural Water Pumping Cluster Package',
        authority: 'Distributed Energy Demo Board',
        sanctionedQuantity: 250,
        contractValue: 96000000,
        awardDate: daysAgo(80),
        startDate: daysAgo(70),
        endDate: daysFromNow(300),
        status: 'ACTIVE',
      },
    ]);
    const contractOne = contracts[0];
    const contractTwo = contracts[1];

    const workOrders = await WorkOrder.insertMany([
      {
        companyId: companyOne._id,
        programId: programOne._id,
        contractId: contractOne._id,
        number: 'WO-SKEPL-001',
        title: 'Vidarbha Cluster Installations',
        loaNumber: contractOne.number,
        sanctionedQuantity: 220,
        contractValue: 81000000,
        startDate: daysAgo(75),
        dueDate: daysFromNow(120),
        status: 'ACTIVE',
      },
      {
        companyId: companyTwo._id,
        programId: programTwo._id,
        contractId: contractTwo._id,
        number: 'WO-AVSIL-001',
        title: 'Pune Division Demonstration Lots',
        loaNumber: contractTwo.number,
        sanctionedQuantity: 120,
        contractValue: 41000000,
        startDate: daysAgo(55),
        dueDate: daysFromNow(150),
        status: 'ACTIVE',
      },
    ]);
    const workOrderOne = workOrders[0];
    const workOrderTwo = workOrders[1];

    const workPackages = await WorkPackage.insertMany([
      {
        companyId: companyOne._id,
        programId: programOne._id,
        workOrderId: workOrderOne._id,
        code: 'WP-NAG-001',
        name: 'Nagpur Rural Package',
        agencyId: nagpurAgency._id,
        geography: { country: 'India', state: 'Maharashtra', district: 'Nagpur', taluka: 'Hingna', villages: ['Wanadongri', 'Gumgaon', 'Dhamna'] },
        assignedQuantity: 10,
        assignedAt: daysAgo(60),
        dueDate: daysFromNow(45),
        status: 'IN_PROGRESS',
      },
      {
        companyId: companyOne._id,
        programId: programOne._id,
        workOrderId: workOrderOne._id,
        code: 'WP-NAS-001',
        name: 'Nashik Solar Pump Package',
        agencyId: nashikAgency._id,
        geography: { country: 'India', state: 'Maharashtra', district: 'Nashik', taluka: 'Sinnar', villages: ['Nandur Shingote', 'Pangri', 'Dubere'] },
        assignedQuantity: 8,
        assignedAt: daysAgo(52),
        dueDate: daysFromNow(55),
        status: 'IN_PROGRESS',
      },
      {
        companyId: companyTwo._id,
        programId: programTwo._id,
        workOrderId: workOrderTwo._id,
        code: 'WP-PUN-001',
        name: 'Pune Demo Package',
        agencyId: puneAgency._id,
        geography: { country: 'India', state: 'Maharashtra', district: 'Pune', taluka: 'Baramati', villages: ['Morgaon', 'Katewadi', 'Pandharewadi'] },
        assignedQuantity: 6,
        assignedAt: daysAgo(40),
        dueDate: daysFromNow(70),
        status: 'ASSIGNED',
      },
    ]);
    const [wpNagpur, wpNashik, wpPune] = workPackages;

    const importBatches = await ImportBatch.insertMany([
      {
        companyId: companyOne._id,
        type: 'BENEFICIARY_MASTER',
        sourceFileName: 'nagpur-beneficiaries-demo.xlsx',
        fileHash: 'demo-nagpur-batch',
        status: 'COMPLETED',
        totalRows: 10,
        successRows: 10,
        failedRows: 0,
        skippedRows: 0,
        uploadedBy: companyUsers.c1_admin._id,
      },
      {
        companyId: companyOne._id,
        type: 'BENEFICIARY_MASTER',
        sourceFileName: 'nashik-beneficiaries-demo.xlsx',
        fileHash: 'demo-nashik-batch',
        status: 'COMPLETED',
        totalRows: 8,
        successRows: 8,
        failedRows: 0,
        skippedRows: 0,
        uploadedBy: companyUsers.c1_admin._id,
      },
      {
        companyId: companyTwo._id,
        type: 'BENEFICIARY_MASTER',
        sourceFileName: 'pune-beneficiaries-demo.xlsx',
        fileHash: 'demo-pune-batch',
        status: 'COMPLETED',
        totalRows: 6,
        successRows: 6,
        failedRows: 0,
        skippedRows: 0,
        uploadedBy: companyUsers.c2_admin._id,
      },
    ]);

    const farmersPayload = [
      ['OPS-DM-001', 'Bharat Wankhede', '9823011001', 'Nagpur', 'Hingna', 'Wanadongri', wpNagpur, nagpurAgency, companyOne, programOne, workOrderOne, 'Pending', 'Pending', ''],
      ['OPS-DM-002', 'Suresh Meshram', '9823011002', 'Nagpur', 'Hingna', 'Gumgaon', wpNagpur, nagpurAgency, companyOne, programOne, workOrderOne, 'Ordered', 'In Progress', ''],
      ['OPS-DM-003', 'Lata Gaikwad', '9823011003', 'Nagpur', 'Hingna', 'Dhamna', wpNagpur, nagpurAgency, companyOne, programOne, workOrderOne, 'Ready for Installation', 'Completed', ''],
      ['OPS-DM-004', 'Ramesh Atram', '9823011004', 'Nagpur', 'Katol', 'Kalmeshwar', wpNagpur, nagpurAgency, companyOne, programOne, workOrderOne, 'Installation Completed', 'Completed', ''],
      ['OPS-DM-005', 'Savita Dhoble', '9823011005', 'Nagpur', 'Saoner', 'Kandri', wpNagpur, nagpurAgency, companyOne, programOne, workOrderOne, 'Complaint Raised', 'Completed', 'Motor tripping frequently'],
      ['OPS-DM-006', 'Dilip Khandekar', '9823011006', 'Nashik', 'Sinnar', 'Nandur Shingote', wpNashik, nashikAgency, companyOne, programOne, workOrderOne, 'Closed', 'Completed', ''],
      ['OPS-DM-007', 'Geeta Ahire', '9823011007', 'Nashik', 'Sinnar', 'Pangri', wpNashik, nashikAgency, companyOne, programOne, workOrderOne, 'Pending Installation', 'Completed', ''],
      ['OPS-DM-008', 'Mahesh Sonawane', '9823011008', 'Nashik', 'Sinnar', 'Dubere', wpNashik, nashikAgency, companyOne, programOne, workOrderOne, 'Dispatch Completed', 'Completed', ''],
      ['OPS-DM-009', 'Shobha Chavan', '9823011009', 'Pune', 'Baramati', 'Morgaon', wpPune, puneAgency, companyTwo, programTwo, workOrderTwo, 'Pending', 'Pending', ''],
      ['OPS-DM-010', 'Vishal Jagtap', '9823011010', 'Pune', 'Baramati', 'Katewadi', wpPune, puneAgency, companyTwo, programTwo, workOrderTwo, 'Ordered', 'In Progress', ''],
      ['OPS-DM-011', 'Anita More', '9823011011', 'Pune', 'Baramati', 'Pandharewadi', wpPune, puneAgency, companyTwo, programTwo, workOrderTwo, 'Ready for Installation', 'Completed', ''],
      ['OPS-DM-012', 'Prakash Bawane', '9823011012', 'Nagpur', 'Hingna', 'Isasani', wpNagpur, nagpurAgency, companyOne, programOne, workOrderOne, 'Pending Installation', 'Completed', 'Consent document pending'],
      ['OPS-DM-013', 'Meena Khobragade', '9823011013', 'Nagpur', 'Kalmeshwar', 'Borgaon', wpNagpur, nagpurAgency, companyOne, programOne, workOrderOne, 'Move to Installation', 'Completed', ''],
      ['OPS-DM-014', 'Nitin Uikey', '9823011014', 'Nagpur', 'Saoner', 'Khapa', wpNagpur, nagpurAgency, companyOne, programOne, workOrderOne, 'Dispatch Completed', 'Completed', ''],
      ['OPS-DM-015', 'Sunanda Raut', '9823011015', 'Nagpur', 'Katol', 'Yenwa', wpNagpur, nagpurAgency, companyOne, programOne, workOrderOne, 'Installation Completed', 'Completed', ''],
      ['OPS-DM-016', 'Arun Shende', '9823011016', 'Nagpur', 'Ramtek', 'Mansar', wpNagpur, nagpurAgency, companyOne, programOne, workOrderOne, 'Closed', 'Completed', ''],
      ['OPS-DM-017', 'Kalpana Pawar', '9823011017', 'Nashik', 'Sinnar', 'Musalgaon', wpNashik, nashikAgency, companyOne, programOne, workOrderOne, 'Pending', 'Pending', 'Land document pending'],
      ['OPS-DM-018', 'Ganesh Jadhav', '9823011018', 'Nashik', 'Niphad', 'Lasalgaon', wpNashik, nashikAgency, companyOne, programOne, workOrderOne, 'Pending', 'In Progress', 'Water-source verification pending'],
      ['OPS-DM-019', 'Rukmini Shinde', '9823011019', 'Nashik', 'Sinnar', 'Wavi', wpNashik, nashikAgency, companyOne, programOne, workOrderOne, 'Ordered', 'Completed', ''],
      ['OPS-DM-020', 'Dattatray Gite', '9823011020', 'Nashik', 'Niphad', 'Pimpalgaon', wpNashik, nashikAgency, companyOne, programOne, workOrderOne, 'Ready for Installation', 'Completed', 'Material received; installation slot pending'],
      ['OPS-DM-021', 'Sangita Wagh', '9823011021', 'Nashik', 'Sinnar', 'Devpur', wpNashik, nashikAgency, companyOne, programOne, workOrderOne, 'Complaint Raised', 'Completed', 'Controller display intermittently blank'],
      ['OPS-DM-022', 'Baban Kumbhar', '9823011022', 'Pune', 'Baramati', 'Malegaon', wpPune, puneAgency, companyTwo, programTwo, workOrderTwo, 'Pending Installation', 'Completed', ''],
      ['OPS-DM-023', 'Vaishali Shitole', '9823011023', 'Pune', 'Baramati', 'Someshwar Nagar', wpPune, puneAgency, companyTwo, programTwo, workOrderTwo, 'Installation Completed', 'Completed', ''],
      ['OPS-DM-024', 'Ashok Chavan', '9823011024', 'Pune', 'Indapur', 'Bhigwan', wpPune, puneAgency, companyTwo, programTwo, workOrderTwo, 'Closed', 'Completed', ''],
    ];

    const demoSurveyPhotos=['survey-site-01.png','survey-site-02.jpg','survey-site-03.jpg','survey-visit-01.png','survey-visit-02.jpg','survey-visit-03.jpg','site-verification-01.png','site-verification-02.jpg','site-verification-03.jpg'];
    const demoInstallPhotos=['installation-progress-01.png','installation-progress-02.jpg','installation-progress-03.jpg','completed-installation-01.png','completed-installation-02.jpg','completed-installation-03.jpg'];
    const demoServicePhotos=['service-visit-01.png','service-visit-02.jpg','service-visit-03.jpg'];
    const demoCoordinates={Nagpur:[21.1458,79.0882],Nashik:[19.9975,73.7898],Pune:[18.5204,73.8567]};
    const demoFieldTeamByPackage={
      'WP-NAG-001':{surveyorName:'Nagpur Field Ops Survey Team',surveyorMobile:'9200000002',technician:'nagpur.tech01',admin:'nagpur.admin'},
      'WP-NAS-001':{surveyorName:'Nashik Rural Survey Team',surveyorMobile:'9300000002',technician:'nashik.tech01',admin:'nashik.admin'},
      'WP-PUN-001':{surveyorName:'Pune Energy Survey Team',surveyorMobile:'9400000002',technician:'pune.tech01',admin:'pune.admin'},
    };
    const farmers = [];
    for (let i = 0; i < farmersPayload.length; i += 1) {
      const [beneficiaryId, beneficiaryName, mobile, district, taluka, village, wp, agency, company, program, workOrder, applicationStatus, inspectionStatus, issue] = farmersPayload[i];
      const surveyPhoto=media(demoSurveyPhotos[i%demoSurveyPhotos.length]),surveyPhoto2=media(demoSurveyPhotos[(i+3)%demoSurveyPhotos.length]);
      const installPhoto=media(demoInstallPhotos[i%demoInstallPhotos.length]),installPhoto2=media(demoInstallPhotos[(i+2)%demoInstallPhotos.length]);
      const servicePhoto=media(demoServicePhotos[i%demoServicePhotos.length]);
      const hasSurvey=inspectionStatus!=='Pending',hasInstalled=['Installation Completed','Complaint Raised','Closed'].includes(applicationStatus);
      const baseGeo=demoCoordinates[district]||[20.5,78.9],latitude=Number((baseGeo[0]+((i%5)-2)*0.018).toFixed(6)),longitude=Number((baseGeo[1]+((i%4)-1.5)*0.021).toFixed(6));
      const fieldTeam=demoFieldTeamByPackage[wp.code]||demoFieldTeamByPackage['WP-NAG-001'];
      const farmer = await Farmer.create({
        beneficiaryId,
        beneficiaryName,
        mobile,
        alternateMobileNumber: `98${String(23011050 + i).slice(-8)}`,
        aadharNo: `9999-8888-${1000 + i}`,
        scheme: i < 8 ? 'MEDA PM KUSUM Phase 1' : 'MSEDCL PM KUSUM T 2',
        casteCategory: i % 3 === 0 ? 'OBC' : i % 3 === 1 ? 'SC' : 'Open',
        landAddress: `${village}, ${taluka}, ${district}`,
        village,
        taluka,
        district,
        divisionName: district === 'Pune' ? 'Pune' : district,
        circleName: `${district} Circle`,
        zoneName: `${district} Zone`,
        siteDepth: `${120 + i * 5}`,
        inspectionStatus,
        inspectionStatusFinal: ['Installation Completed', 'Complaint Raised', 'Closed'].includes(applicationStatus)
          ? 'SYSTEM DETAILS SUBMITTED'
          : 'VENDOR INFORMATION RECEIVED',
        applicationStatus,
        siteLocation: `${latitude},${longitude}`,
        pumpType: i % 2 === 0 ? 'AC Solar Pump' : 'DC Solar Pump',
        pumpHP: i % 2 === 0 ? '5 HP' : '7.5 HP',
        controllerTypeWithOrWithout: 'With Controller',
        assignedVendorCompanyName: company.name,
        vendorAssignmentDate: daysAgo(55 - i),
        surveyorName: fieldTeam.surveyorName,
        surveyorMobile: fieldTeam.surveyorMobile,
        sourceType: 'Borewell',
        landHoldingAcre: `${3 + (i % 4)}`,
        landOwnershipType: 'Self Owned',
        actualHeadM: `${20 + i}`,
        sourceDepthFeet: `${180 + i * 3}`,
        jsrDeviationYesNo: inspectionStatus==='Pending'?'':inspectionStatus==='In Progress'?'VENDOR INFORMATION RECEIVED':'JSR SUBMITTED',
        deviationRemarks: issue&&inspectionStatus!=='Completed'?issue:'',
        surveyDate: hasSurvey?daysAgo(Math.max(2,50-i)):null,
        jsrTechnician: fieldTeam.technician,
        materialOnSiteOrWarehouse: ['Ready for Installation', 'Installation Completed', 'Complaint Raised', 'Closed', 'Dispatch Completed'].includes(applicationStatus) ? 'On Site' : 'Warehouse',
        warehouseInwardDate: daysAgo(30 - i),
        vehicleNo: district === 'Nagpur' ? 'MH31AB1234' : district === 'Nashik' ? 'MH15ZX4578' : 'MH12PQ9012',
        lotNo: `LOT-${district.slice(0, 3).toUpperCase()}-${i + 1}`,
        fullSetOrPartialSet: 'Full Set',
        invoiceNo: `INV-${beneficiaryId}`,
        waybillNoFromCompany: `WB-${beneficiaryId}`,
        lot: `LOT-${i + 1}`,
        materialDispatchDate: daysAgo(20 - i),
        transporterName: 'Opsynq Logistics Demo',
        transporterVehicleNo: district === 'Pune' ? 'MH12DD4455' : 'MH31CC7788',
        materialReceivedConfirmationYesNo: ['Ready for Installation', 'Installation Completed', 'Complaint Raised', 'Closed', 'Dispatch Completed'].includes(applicationStatus) ? 'Yes' : 'No',
        shortageDamagedRemarks: beneficiaryId==='OPS-DM-014'?'One outer carton received dented; contents verified intact.':'',
        invoiceDate: daysAgo(25 - i),
        waybillNo: `WYB-${beneficiaryId}`,
        deliveryChallanNo: `DC-${beneficiaryId}`,
        installationDate: ['Installation Completed', 'Complaint Raised', 'Closed'].includes(applicationStatus) ? daysAgo(10 + i) : null,
        installationCompletionDate: ['Installation Completed', 'Complaint Raised', 'Closed'].includes(applicationStatus) ? daysAgo(8 + i) : null,
        installedByTechnicianName: fieldTeam.technician,
        commissioningDate: ['Installation Completed', 'Complaint Raised', 'Closed'].includes(applicationStatus) ? daysAgo(7 + i) : null,
        installedPhotoUpload: hasInstalled?installPhoto:'',
        panels: ['PNL-DEMO-001', 'PNL-DEMO-002', 'PNL-DEMO-003'],
        pumpNoUnique: `PUMP-${beneficiaryId}`,
        motorNoUnique: `MOTOR-${beneficiaryId}`,
        controllerNoUnique: `CTRL-${beneficiaryId}`,
        imeiNoUnique: `IMEI-${beneficiaryId}`,
        installationDoneYesNo: ['Installation Completed', 'Complaint Raised', 'Closed'].includes(applicationStatus) ? 'Yes' : 'No',
        pumpNotOperatingYesNo: applicationStatus === 'Complaint Raised' ? 'Yes' : 'No',
        companyAssignedPersonName: company.contact?.name,
        complaintIssue: applicationStatus === 'Complaint Raised' ? issue : '',
        complaintRaisedDate: applicationStatus === 'Complaint Raised' ? daysAgo(2) : null,
        complaintNumber: applicationStatus === 'Complaint Raised' ? `CMP-2026-${String(i+1).padStart(3,'0')}` : '',
        complaintRaisedByName: applicationStatus === 'Complaint Raised' ? beneficiaryName : '',
        complaintRaisedById: applicationStatus === 'Complaint Raised' ? beneficiaryId : '',
        complaintStatus: applicationStatus === 'Complaint Raised' ? 'Open' : applicationStatus === 'Closed' ? 'Resolved' : '',
        farmerPhotoUrl: surveyPhoto,
        sitePhotosUrls: hasSurvey?[surveyPhoto,surveyPhoto2]:[surveyPhoto],
        signatureUrl: hasSurvey?surveyPhoto2:'',
        finalfarmerPhotoUrl: hasInstalled?installPhoto2:'',
        finalsitePhotosUrls: hasInstalled?[installPhoto,installPhoto2]:[],
        finalsignatureUrl: hasInstalled?surveyPhoto2:'',
        finalsurveyorsignatureUrl: hasInstalled?surveyPhoto:'',
        excelFileName: `${district.toLowerCase()}-demo-import.xlsx`,
        excelUploadDate: daysAgo(58 - i),
        orderReceivedByTechnician: fieldTeam.technician,
        orderReceivedConfirmationYesNo: ['Ordered', 'Dispatch Completed', 'Ready for Installation', 'Installation Completed', 'Complaint Raised', 'Closed'].includes(applicationStatus) ? 'Yes' : 'No',
        orderReceivedDate: ['Ordered', 'Dispatch Completed', 'Ready for Installation', 'Installation Completed', 'Complaint Raised', 'Closed'].includes(applicationStatus) ? daysAgo(18 - i) : null,
        orderReceivedRemarks: 'Demo seeded order acknowledgement',
        orderReceivedYesNo: ['Ordered', 'Dispatch Completed', 'Ready for Installation', 'Installation Completed', 'Complaint Raised', 'Closed'].includes(applicationStatus) ? 'Yes' : 'No',
        materialReceivedDate: ['Dispatch Completed', 'Ready for Installation', 'Installation Completed', 'Complaint Raised', 'Closed'].includes(applicationStatus) ? daysAgo(14 - i) : null,
        remarks: issue||'Demo beneficiary record seeded for workflow presentation.',
        confirmedBy: fieldTeam.admin,
        confirmationDate: daysAgo(12 - i),
        lrPhotoUrls: ['Dispatch Completed','Ready for Installation','Installation Completed','Complaint Raised','Closed'].includes(applicationStatus)?[installPhoto]:[],
      });
      farmers.push({ farmer, wp, agency, company, program, workOrder, importBatch: wp.code === 'WP-NAG-001' ? importBatches[0] : wp.code === 'WP-NAS-001' ? importBatches[1] : importBatches[2] });
    }

    await BeneficiaryContext.insertMany(
      farmers.map(({ farmer, wp, agency, company, program, workOrder, importBatch }, index) => ({
        farmerId: farmer._id,
        companyId: company._id,
        programId: program._id,
        workOrderId: workOrder._id,
        workPackageId: wp._id,
        agencyId: agency._id,
        sourceImportBatchId: importBatch._id,
        sourceRowNumber: index + 2,
        sourceAuthority: program.authority,
        originalData: { beneficiaryName: farmer.beneficiaryName, mobile: farmer.mobile, village: farmer.village },
        normalizedData: { district: farmer.district, taluka: farmer.taluka, applicationStatus: farmer.applicationStatus },
        validationStatus: 'VALID',
        assignedAt: daysAgo(48 - index),
        assignmentHistory: [{ when: daysAgo(48 - index), by: 'system', action: `Assigned to ${agency.name}` }],
      }))
    );

    const items = await ItemMaster.insertMany([
      { companyId: companyOne._id, sku: 'PUMP-5HP', name: 'Solar Pump 5HP', category: 'Pump', brand: 'HelioFlow', manufacturer: 'HelioFlow', model: 'HF-5', serialTracked: true, minStock: 5, reorderLevel: 10, warrantyMonths: 24, installationRole: 'PUMP' },
      { companyId: companyOne._id, sku: 'MOTOR-5HP', name: 'Submersible Motor 5HP', category: 'Motor', brand: 'HelioFlow', manufacturer: 'HelioFlow', model: 'HM-5', serialTracked: true, minStock: 5, reorderLevel: 10, warrantyMonths: 24, installationRole: 'MOTOR' },
      { companyId: companyOne._id, sku: 'CTRL-SMART', name: 'Smart Controller', category: 'Controller', brand: 'SunMesh', manufacturer: 'SunMesh', model: 'SM-CTRL', serialTracked: true, minStock: 5, reorderLevel: 10, warrantyMonths: 24, installationRole: 'CONTROLLER' },
      { companyId: companyOne._id, sku: 'PNL-550', name: 'Solar Panel 550W', category: 'Panel', brand: 'PhotonOne', manufacturer: 'PhotonOne', model: 'P550', serialTracked: true, minStock: 20, reorderLevel: 50, warrantyMonths: 120, installationRole: 'PANEL' },
      { companyId: companyTwo._id, sku: 'PUMP-7HP', name: 'Solar Pump 7.5HP', category: 'Pump', brand: 'AquaVolt', manufacturer: 'AquaVolt', model: 'AV-75', serialTracked: true, minStock: 4, reorderLevel: 8, warrantyMonths: 24, installationRole: 'PUMP' },
      { companyId: companyTwo._id, sku: 'CTRL-FIELD', name: 'Field Controller', category: 'Controller', brand: 'AquaVolt', manufacturer: 'AquaVolt', model: 'FC-200', serialTracked: true, minStock: 4, reorderLevel: 8, warrantyMonths: 24, installationRole: 'CONTROLLER' },
      { companyId: companyTwo._id, sku: 'PNL-540', name: 'Solar Panel 540W', category: 'Panel', brand: 'PhotonOne', manufacturer: 'PhotonOne', model: 'P540', serialTracked: true, minStock: 20, reorderLevel: 40, warrantyMonths: 120, installationRole: 'PANEL' },
    ]);

    const itemMap = Object.fromEntries(items.map((item) => [item.sku, item]));

    const warehouses = await Warehouse.insertMany([
      { companyId: companyOne._id, code: 'WH-NAG-CEN', name: 'Nagpur Central Warehouse', type: 'CENTRAL', address: { line1: 'Warehouse Road', city: 'Nagpur', district: 'Nagpur', state: 'Maharashtra', country: 'India', pincode: '440016' }, location: { latitude: 21.122, longitude: 79.059 } },
      { companyId: companyOne._id, code: 'WH-NAG-AGY', name: 'Nagpur Agency Stock', type: 'AGENCY', organizationId: nagpurAgency._id, address: { line1: 'Hingna Depot', city: 'Nagpur', district: 'Nagpur', state: 'Maharashtra', country: 'India', pincode: '440016' }, location: { latitude: 21.105, longitude: 79.031 } },
      { companyId: companyOne._id, code: 'WH-NAS-AGY', name: 'Nashik Agency Stock', type: 'AGENCY', organizationId: nashikAgency._id, address: { line1: 'Sinnar Depot', city: 'Nashik', district: 'Nashik', state: 'Maharashtra', country: 'India', pincode: '422103' }, location: { latitude: 19.84, longitude: 73.99 } },
      { companyId: companyTwo._id, code: 'WH-PUN-CEN', name: 'Pune Central Warehouse', type: 'CENTRAL', address: { line1: 'Baramati Link Road', city: 'Pune', district: 'Pune', state: 'Maharashtra', country: 'India', pincode: '411028' }, location: { latitude: 18.543, longitude: 73.936 } },
      { companyId: companyTwo._id, code: 'WH-PUN-AGY', name: 'Pune Agency Stock', type: 'AGENCY', organizationId: puneAgency._id, address: { line1: 'Baramati Depot', city: 'Pune', district: 'Pune', state: 'Maharashtra', country: 'India', pincode: '413102' }, location: { latitude: 18.151, longitude: 74.577 } },
    ]);
    const warehouseMap = Object.fromEntries(warehouses.map((w) => [w.code, w]));

    const serialsPayload = [];
    const addSerials = (companyId, item, count, prefix, warehouseId, status, agencyId = null) => {
      for (let idx = 1; idx <= count; idx += 1) {
        serialsPayload.push({
          companyId,
          itemId: item._id,
          serialNumber: `${prefix}-${String(idx).padStart(3, '0')}`,
          barcodeValue: `${prefix}-BC-${String(idx).padStart(3, '0')}`,
          status,
          warehouseId,
          agencyId,
          metadata: { seeded: true },
        });
      }
    };
    addSerials(companyOne._id, itemMap['PUMP-5HP'], 8, 'P5-NAG', warehouseMap['WH-NAG-CEN']._id, 'AVAILABLE');
    addSerials(companyOne._id, itemMap['MOTOR-5HP'], 8, 'M5-NAG', warehouseMap['WH-NAG-CEN']._id, 'AVAILABLE');
    addSerials(companyOne._id, itemMap['CTRL-SMART'], 8, 'C1-NAG', warehouseMap['WH-NAG-CEN']._id, 'AVAILABLE');
    addSerials(companyOne._id, itemMap['PNL-550'], 20, 'PNL-NAG', warehouseMap['WH-NAG-CEN']._id, 'AVAILABLE');
    addSerials(companyTwo._id, itemMap['PUMP-7HP'], 5, 'P7-PUN', warehouseMap['WH-PUN-CEN']._id, 'AVAILABLE');
    addSerials(companyTwo._id, itemMap['CTRL-FIELD'], 5, 'CF-PUN', warehouseMap['WH-PUN-CEN']._id, 'AVAILABLE');
    addSerials(companyTwo._id, itemMap['PNL-540'], 12, 'PNL-PUN', warehouseMap['WH-PUN-CEN']._id, 'AVAILABLE');
    const serials = await InventorySerial.insertMany(serialsPayload);
    const serialMap = Object.fromEntries(serials.map((s) => [s.serialNumber, s]));

    const purchaseOrders = await PurchaseOrder.insertMany([
      {
        companyId: companyOne._id,
        number: 'PO-SKEPL-001',
        supplierName: 'HelioFlow Manufacturing',
        warehouseId: warehouseMap['WH-NAG-CEN']._id,
        currency: 'INR',
        orderDate: daysAgo(70),
        expectedDate: daysAgo(45),
        status: 'RECEIVED',
        lines: [
          { itemId: itemMap['PUMP-5HP']._id, description: 'Solar Pump 5HP', orderedQty: 8, receivedQty: 8, unitPrice: 118000, taxPercent: 18 },
          { itemId: itemMap['PNL-550']._id, description: 'Solar Panel 550W', orderedQty: 20, receivedQty: 20, unitPrice: 13800, taxPercent: 12 },
        ],
        createdBy: companyUsers.c1_inventory._id,
      },
      {
        companyId: companyTwo._id,
        number: 'PO-AVSIL-001',
        supplierName: 'AquaVolt Systems',
        warehouseId: warehouseMap['WH-PUN-CEN']._id,
        currency: 'INR',
        orderDate: daysAgo(48),
        expectedDate: daysAgo(20),
        status: 'PARTIAL',
        lines: [
          { itemId: itemMap['PUMP-7HP']._id, description: 'Solar Pump 7.5HP', orderedQty: 5, receivedQty: 3, unitPrice: 126000, taxPercent: 18 },
          { itemId: itemMap['PNL-540']._id, description: 'Solar Panel 540W', orderedQty: 12, receivedQty: 12, unitPrice: 13200, taxPercent: 12 },
        ],
        createdBy: companyUsers.c2_inventory._id,
      },
    ]);

    await GoodsReceipt.insertMany([
      {
        companyId: companyOne._id,
        number: 'GRN-SKEPL-001',
        purchaseOrderId: purchaseOrders[0]._id,
        warehouseId: warehouseMap['WH-NAG-CEN']._id,
        receivedAt: daysAgo(44),
        supplierDocument: 'HF/2026/GRN/11',
        lines: [
          { itemId: itemMap['PUMP-5HP']._id, quantity: 8, acceptedQty: 8, rejectedQty: 0, serialIds: serials.filter((s) => s.serialNumber.startsWith('P5-NAG')).map((s) => s._id) },
          { itemId: itemMap['PNL-550']._id, quantity: 20, acceptedQty: 20, rejectedQty: 0, serialIds: serials.filter((s) => s.serialNumber.startsWith('PNL-NAG')).map((s) => s._id) },
        ],
        receivedBy: companyUsers.c1_inventory._id,
      },
      {
        companyId: companyTwo._id,
        number: 'GRN-AVSIL-001',
        purchaseOrderId: purchaseOrders[1]._id,
        warehouseId: warehouseMap['WH-PUN-CEN']._id,
        receivedAt: daysAgo(21),
        supplierDocument: 'AV/2026/GRN/7',
        lines: [
          { itemId: itemMap['PUMP-7HP']._id, quantity: 3, acceptedQty: 3, rejectedQty: 0, serialIds: serials.filter((s) => s.serialNumber.startsWith('P7-PUN')).slice(0, 3).map((s) => s._id) },
          { itemId: itemMap['PNL-540']._id, quantity: 12, acceptedQty: 12, rejectedQty: 0, serialIds: serials.filter((s) => s.serialNumber.startsWith('PNL-PUN')).map((s) => s._id) },
        ],
        receivedBy: companyUsers.c2_inventory._id,
      },
    ]);

    await InventoryBalance.insertMany([
      { companyId: companyOne._id, warehouseId: warehouseMap['WH-NAG-CEN']._id, itemId: itemMap['PUMP-5HP']._id, onHand: 4, allocated: 2, inTransit: 2, damaged: 0, lastMovementAt: daysAgo(1) },
      { companyId: companyOne._id, warehouseId: warehouseMap['WH-NAG-CEN']._id, itemId: itemMap['MOTOR-5HP']._id, onHand: 5, allocated: 1, inTransit: 2, damaged: 0, lastMovementAt: daysAgo(1) },
      { companyId: companyOne._id, warehouseId: warehouseMap['WH-NAG-AGY']._id, itemId: itemMap['PUMP-5HP']._id, onHand: 1, allocated: 1, inTransit: 0, damaged: 0, lastMovementAt: daysAgo(2) },
      { companyId: companyOne._id, warehouseId: warehouseMap['WH-NAS-AGY']._id, itemId: itemMap['PUMP-5HP']._id, onHand: 1, allocated: 1, inTransit: 0, damaged: 0, lastMovementAt: daysAgo(3) },
      { companyId: companyTwo._id, warehouseId: warehouseMap['WH-PUN-CEN']._id, itemId: itemMap['PUMP-7HP']._id, onHand: 1, allocated: 1, inTransit: 1, damaged: 0, lastMovementAt: daysAgo(1) },
      { companyId: companyTwo._id, warehouseId: warehouseMap['WH-PUN-AGY']._id, itemId: itemMap['PUMP-7HP']._id, onHand: 1, allocated: 0, inTransit: 0, damaged: 0, lastMovementAt: daysAgo(4) },
    ]);

    const driverOne = await Driver.create({ companyId: companyOne._id, name: 'Ganesh Uikey', mobile: '9511111001', licenseNumber: 'MH31-2026-DRV1', isActive: true, lastLocation: { latitude: 21.18, longitude: 79.06, accuracy: 12, capturedAt: new Date(), updatedAt: new Date() } });
    const driverTwo = await Driver.create({ companyId: companyTwo._id, name: 'Ajit Kadam', mobile: '9511111002', licenseNumber: 'MH12-2026-DRV2', isActive: true, lastLocation: { latitude: 18.32, longitude: 74.58, accuracy: 12, capturedAt: new Date(), updatedAt: new Date() } });
    const vehicleOne = await Vehicle.create({ companyId: companyOne._id, registrationNo: 'MH31AB1234', type: 'Mini Truck', capacity: '2 Ton', isActive: true });
    const vehicleTwo = await Vehicle.create({ companyId: companyTwo._id, registrationNo: 'MH12PQ9012', type: 'Pickup', capacity: '1.5 Ton', isActive: true });

    const nagpurDeliveredSerials = ['P5-NAG-001', 'M5-NAG-001', 'C1-NAG-001', 'PNL-NAG-001', 'PNL-NAG-002', 'PNL-NAG-003'];
    const nashikTransitSerials = ['P5-NAG-003', 'M5-NAG-003', 'C1-NAG-003', 'PNL-NAG-005', 'PNL-NAG-006', 'PNL-NAG-007'];
    const puneDeliveredSerials = ['P7-PUN-001', 'CF-PUN-001', 'PNL-PUN-001', 'PNL-PUN-002', 'PNL-PUN-003'];

    const shipmentOne = await Shipment.create({
      companyId: companyOne._id,
      shipmentNo: 'SHP-SKEPL-001',
      workPackageId: wpNagpur._id,
      fromWarehouseId: warehouseMap['WH-NAG-CEN']._id,
      toWarehouseId: warehouseMap['WH-NAG-AGY']._id,
      agencyId: nagpurAgency._id,
      driverId: driverOne._id,
      vehicleId: vehicleOne._id,
      items: [
        { itemId: itemMap['PUMP-5HP']._id, quantity: 1, serialIds: [serialMap['P5-NAG-001']._id], receivedQty: 1 },
        { itemId: itemMap['MOTOR-5HP']._id, quantity: 1, serialIds: [serialMap['M5-NAG-001']._id], receivedQty: 1 },
        { itemId: itemMap['CTRL-SMART']._id, quantity: 1, serialIds: [serialMap['C1-NAG-001']._id], receivedQty: 1 },
        { itemId: itemMap['PNL-550']._id, quantity: 3, serialIds: nagpurDeliveredSerials.filter((n) => n.startsWith('PNL')).map((n) => serialMap[n]._id), receivedQty: 3 },
      ],
      status: 'DELIVERED',
      dispatchedAt: daysAgo(18),
      deliveredAt: daysAgo(16),
      proofOfDelivery: { receiverName: 'Prashant Wankhede', receivedAt: daysAgo(16), notes: 'Received in good condition', photoUrls: [media('installation-progress-01.png')] },
    });

    const shipmentTwo = await Shipment.create({
      companyId: companyOne._id,
      shipmentNo: 'SHP-SKEPL-002',
      workPackageId: wpNashik._id,
      fromWarehouseId: warehouseMap['WH-NAG-CEN']._id,
      toWarehouseId: warehouseMap['WH-NAS-AGY']._id,
      agencyId: nashikAgency._id,
      driverId: driverOne._id,
      vehicleId: vehicleOne._id,
      items: [
        { itemId: itemMap['PUMP-5HP']._id, quantity: 1, serialIds: [serialMap['P5-NAG-003']._id] },
        { itemId: itemMap['MOTOR-5HP']._id, quantity: 1, serialIds: [serialMap['M5-NAG-003']._id] },
        { itemId: itemMap['CTRL-SMART']._id, quantity: 1, serialIds: [serialMap['C1-NAG-003']._id] },
        { itemId: itemMap['PNL-550']._id, quantity: 3, serialIds: nashikTransitSerials.filter((n) => n.startsWith('PNL')).map((n) => serialMap[n]._id) },
      ],
      status: 'IN_TRANSIT',
      dispatchedAt: daysAgo(3),
      trackingExpiresAt: daysFromNow(10),
    });

    const shipmentThree = await Shipment.create({
      companyId: companyTwo._id,
      shipmentNo: 'SHP-AVSIL-001',
      workPackageId: wpPune._id,
      fromWarehouseId: warehouseMap['WH-PUN-CEN']._id,
      toWarehouseId: warehouseMap['WH-PUN-AGY']._id,
      agencyId: puneAgency._id,
      driverId: driverTwo._id,
      vehicleId: vehicleTwo._id,
      items: [
        { itemId: itemMap['PUMP-7HP']._id, quantity: 1, serialIds: [serialMap['P7-PUN-001']._id], receivedQty: 1 },
        { itemId: itemMap['CTRL-FIELD']._id, quantity: 1, serialIds: [serialMap['CF-PUN-001']._id], receivedQty: 1 },
        { itemId: itemMap['PNL-540']._id, quantity: 3, serialIds: puneDeliveredSerials.filter((n) => n.startsWith('PNL')).map((n) => serialMap[n]._id), receivedQty: 3 },
      ],
      status: 'DELIVERED',
      dispatchedAt: daysAgo(14),
      deliveredAt: daysAgo(12),
      proofOfDelivery: { receiverName: 'Nilesh Patne', receivedAt: daysAgo(12), notes: 'Agency receipt confirmed', photoUrls: [media('survey-visit-01.png')] },
    });

    await TrackingEvent.insertMany([
      { companyId: companyOne._id, shipmentId: shipmentTwo._id, driverId: driverOne._id, latitude: 20.33, longitude: 74.12, accuracy: 20, speed: 42, heading: 90, source: 'DRIVER_LINK', capturedAt: daysAgo(2), metadata: { checkpoint: 'Malegaon bypass' } },
      { companyId: companyOne._id, shipmentId: shipmentTwo._id, driverId: driverOne._id, latitude: 20.02, longitude: 73.79, accuracy: 18, speed: 28, heading: 115, source: 'DRIVER_LINK', capturedAt: daysAgo(1), metadata: { checkpoint: 'Nashik approach' } },
      { companyId: companyTwo._id, shipmentId: shipmentThree._id, driverId: driverTwo._id, latitude: 18.15, longitude: 74.57, accuracy: 12, speed: 0, heading: 0, source: 'DRIVER_LINK', capturedAt: daysAgo(12), metadata: { checkpoint: 'Baramati depot delivered' } },
    ]);

    const installedFarmerIds = ['OPS-DM-004', 'OPS-DM-005', 'OPS-DM-006'];
    const farmerLookup = Object.fromEntries(farmers.map((entry) => [entry.farmer.beneficiaryId, entry]));
    const installedAssets = [];

    const installAssetFor = async ({ beneficiaryId, serialPrefixList, technicianKey }) => {
      const farmerEntry = farmerLookup[beneficiaryId];
      const tech = agencyUsers[technicianKey];
      const companyId = farmerEntry.company._id;
      const agencyId = farmerEntry.agency._id;
      for (const serialNumber of serialPrefixList) {
        const serial = serialMap[serialNumber];
        let assetRole = 'OTHER';
        if (serialNumber.startsWith('P5') || serialNumber.startsWith('P7')) assetRole = 'PUMP';
        if (serialNumber.startsWith('M5')) assetRole = 'MOTOR';
        if (serialNumber.startsWith('C1') || serialNumber.startsWith('CF')) assetRole = 'CONTROLLER';
        if (serialNumber.startsWith('PNL')) assetRole = 'PANEL';
        serial.status = 'INSTALLED';
        serial.farmerId = farmerEntry.farmer._id;
        serial.agencyId = agencyId;
        serial.installedAt = daysAgo(7);
        serial.warehouseId = null;
        await serial.save();
        installedAssets.push(await InstalledAsset.create({
          companyId,
          agencyId,
          farmerId: farmerEntry.farmer._id,
          workPackageId: farmerEntry.wp._id,
          technicianUserId: tech._id,
          itemId: serial.itemId,
          inventorySerialId: serial._id,
          serialNumber: serial.serialNumber,
          barcodeValue: serial.barcodeValue,
          assetRole,
          status: 'ACTIVE',
          installedAt: daysAgo(7),
          warrantyStart: daysAgo(7),
          warrantyEnd: daysFromNow(365),
          metadata: { source: 'demo-seed' },
        }));
      }
    };

    await installAssetFor({ beneficiaryId: 'OPS-DM-004', serialPrefixList: ['P5-NAG-001', 'M5-NAG-001', 'C1-NAG-001', 'PNL-NAG-001'], technicianKey: 'nagpur_tech_1' });
    await installAssetFor({ beneficiaryId: 'OPS-DM-005', serialPrefixList: ['P5-NAG-002', 'M5-NAG-002', 'C1-NAG-002', 'PNL-NAG-004'], technicianKey: 'nagpur_tech_2' });
    await installAssetFor({ beneficiaryId: 'OPS-DM-006', serialPrefixList: ['P5-NAG-004', 'M5-NAG-004', 'C1-NAG-004', 'PNL-NAG-008'], technicianKey: 'nashik_tech_1' });

    await AssetServicePlan.insertMany(
      installedAssets.slice(0, 3).map((asset, index) => ({
        companyId: asset.companyId,
        installedAssetId: asset._id,
        planType: 'WARRANTY',
        provider: index === 2 ? 'AquaVolt' : 'HelioFlow',
        referenceNo: `WRN-${index + 1}`,
        startDate: daysAgo(7),
        endDate: daysFromNow(365),
        status: 'ACTIVE',
        coverage: 'Manufacturing defect and controller support',
        terms: 'Demo warranty coverage',
      }))
    );

    const issueOne = await MaterialIssue.create({
      companyId: companyOne._id,
      agencyId: nagpurAgency._id,
      warehouseId: warehouseMap['WH-NAG-AGY']._id,
      technicianUserId: agencyUsers.nagpur_tech_1._id,
      workPackageId: wpNagpur._id,
      farmerId: farmerLookup['OPS-DM-004'].farmer._id,
      issueNo: 'MI-NAG-001',
      items: [
        { itemId: itemMap['PUMP-5HP']._id, quantity: 1, serialIds: [serialMap['P5-NAG-001']._id] },
        { itemId: itemMap['MOTOR-5HP']._id, quantity: 1, serialIds: [serialMap['M5-NAG-001']._id] },
        { itemId: itemMap['CTRL-SMART']._id, quantity: 1, serialIds: [serialMap['C1-NAG-001']._id] },
      ],
      status: 'CONSUMED',
      issuedAt: daysAgo(10),
      issuedBy: companyUsers.c1_inventory._id,
      notes: 'Material issued for completed installation demo.',
    });

    const issueTwo = await MaterialIssue.create({
      companyId: companyOne._id,
      agencyId: nagpurAgency._id,
      warehouseId: warehouseMap['WH-NAG-AGY']._id,
      technicianUserId: agencyUsers.nagpur_tech_2._id,
      workPackageId: wpNagpur._id,
      farmerId: farmerLookup['OPS-DM-005'].farmer._id,
      issueNo: 'MI-NAG-002',
      items: [
        { itemId: itemMap['PUMP-5HP']._id, quantity: 1, serialIds: [serialMap['P5-NAG-002']._id] },
        { itemId: itemMap['MOTOR-5HP']._id, quantity: 1, serialIds: [serialMap['M5-NAG-002']._id] },
      ],
      status: 'ISSUED',
      issuedAt: daysAgo(9),
      issuedBy: companyUsers.c1_inventory._id,
      notes: 'Issued, later complaint opened for demo case.',
    });

    await StockMovement.insertMany([
      { companyId: companyOne._id, itemId: itemMap['PUMP-5HP']._id, serialIds: [serialMap['P5-NAG-001']._id], quantity: 1, movementType: 'DISPATCH', fromWarehouseId: warehouseMap['WH-NAG-CEN']._id, toWarehouseId: warehouseMap['WH-NAG-AGY']._id, toOrganizationId: nagpurAgency._id, referenceType: 'Shipment', referenceId: shipmentOne._id, performedBy: companyUsers.c1_logistics._id, reason: 'Agency delivery', occurredAt: daysAgo(18) },
      { companyId: companyOne._id, itemId: itemMap['PUMP-5HP']._id, serialIds: [serialMap['P5-NAG-001']._id], quantity: 1, movementType: 'INSTALL', fromWarehouseId: warehouseMap['WH-NAG-AGY']._id, toOrganizationId: nagpurAgency._id, referenceType: 'MaterialIssue', referenceId: issueOne._id, performedBy: companyUsers.c1_inventory._id, reason: 'Installed at farmer site', occurredAt: daysAgo(8) },
      { companyId: companyOne._id, itemId: itemMap['PUMP-5HP']._id, serialIds: [serialMap['P5-NAG-002']._id], quantity: 1, movementType: 'INSTALL', fromWarehouseId: warehouseMap['WH-NAG-AGY']._id, toOrganizationId: nagpurAgency._id, referenceType: 'MaterialIssue', referenceId: issueTwo._id, performedBy: companyUsers.c1_inventory._id, reason: 'Installed at farmer site', occurredAt: daysAgo(8) },
      { companyId: companyTwo._id, itemId: itemMap['PUMP-7HP']._id, serialIds: [serialMap['P7-PUN-001']._id], quantity: 1, movementType: 'DISPATCH', fromWarehouseId: warehouseMap['WH-PUN-CEN']._id, toWarehouseId: warehouseMap['WH-PUN-AGY']._id, toOrganizationId: puneAgency._id, referenceType: 'Shipment', referenceId: shipmentThree._id, performedBy: companyUsers.c2_inventory._id, reason: 'Agency delivery', occurredAt: daysAgo(14) },
    ]);

    const complaintAsset = installedAssets.find((asset) => asset.farmerId.equals(farmerLookup['OPS-DM-005'].farmer._id));
    await ServiceCase.insertMany([
      {
        companyId: companyOne._id,
        agencyId: nagpurAgency._id,
        farmerId: farmerLookup['OPS-DM-005'].farmer._id,
        installedAssetId: complaintAsset?._id,
        caseNo: 'SC-SKEPL-001',
        type: 'COMPLAINT',
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        title: 'Motor tripping after commissioning',
        description: 'Beneficiary reported intermittent motor trip under full load.',
        source: 'BENEFICIARY',
        assignedToLegacyUser: agencyUsers.nagpur_tech_2._id,
        openedAt: daysAgo(2),
        dueAt: daysFromNow(1),
        firstResponseAt: daysAgo(2),
        slaState: 'DUE_SOON',
        evidence: { photoUrls: [media('service-visit-01.png')] },
        metadata: { complaintNumber: 'CMP-2026-001' },
      },
      {
        companyId: companyOne._id,
        agencyId: nagpurAgency._id,
        farmerId: farmerLookup['OPS-DM-004'].farmer._id,
        installedAssetId: installedAssets.find((asset) => asset.farmerId.equals(farmerLookup['OPS-DM-004'].farmer._id))?._id,
        caseNo: 'SC-SKEPL-002',
        type: 'PREVENTIVE_MAINTENANCE',
        priority: 'LOW',
        status: 'RESOLVED',
        title: 'First preventive service visit',
        description: 'Quarterly preventive service completed successfully.',
        source: 'SYSTEM',
        assignedToLegacyUser: agencyUsers.nagpur_tech_1._id,
        openedAt: daysAgo(5),
        dueAt: daysAgo(2),
        resolvedAt: daysAgo(2),
        slaState: 'ON_TRACK',
        resolution: 'All parameters normal. No corrective action required.',
        evidence: { photoUrls: [media('service-visit-01.png')] },
      },
      {
        companyId: companyTwo._id,
        agencyId: puneAgency._id,
        farmerId: farmerLookup['OPS-DM-011'].farmer._id,
        caseNo: 'SC-AVSIL-001',
        type: 'WARRANTY',
        priority: 'MEDIUM',
        status: 'OPEN',
        title: 'Controller calibration check pending',
        description: 'Commissioning support visit scheduled.',
        source: 'COMPANY',
        assignedToPlatformUser: companyUsers.c2_quality._id,
        openedAt: daysAgo(1),
        dueAt: daysFromNow(3),
        slaState: 'ON_TRACK',
      },
      {
        companyId: companyOne._id,
        agencyId: nashikAgency._id,
        farmerId: farmerLookup['OPS-DM-021'].farmer._id,
        caseNo: 'SC-SKEPL-003',
        type: 'COMPLAINT',
        priority: 'MEDIUM',
        status: 'ASSIGNED',
        title: 'Controller display intermittently blank',
        description: 'Technician visit assigned; controller diagnostics are pending.',
        source: 'BENEFICIARY',
        assignedToLegacyUser: agencyUsers.nashik_tech_2._id,
        openedAt: daysAgo(1),
        dueAt: daysFromNow(2),
        firstResponseAt: new Date(),
        slaState: 'ON_TRACK',
        evidence: { photoUrls: [media('service-visit-02.jpg')] },
        metadata: { complaintNumber: 'CMP-2026-021', demoScenario: 'assigned complaint awaiting field diagnosis' },
      },
    ]);

    await CommercialClaim.insertMany([
      {
        companyId: companyOne._id,
        programId: programOne._id,
        contractId: contractOne._id,
        workOrderId: workOrderOne._id,
        workPackageId: wpNagpur._id,
        claimNo: 'CLM-SKEPL-001',
        title: 'Nagpur Completed Installation Claim',
        status: 'SUBMITTED',
        currency: 'INR',
        grossAmount: 845000,
        eligibleAmount: 810000,
        approvedAmount: 0,
        paidAmount: 0,
        beneficiaryCount: 2,
        readyAt: daysAgo(4),
        submittedAt: daysAgo(3),
        dueAt: daysFromNow(7),
        slaState: 'ON_TRACK',
        notes: 'Backed by completion proofs and inspection records.',
      },
      {
        companyId: companyTwo._id,
        programId: programTwo._id,
        contractId: contractTwo._id,
        workOrderId: workOrderTwo._id,
        workPackageId: wpPune._id,
        claimNo: 'CLM-AVSIL-001',
        title: 'Pune Demo Advance Claim',
        status: 'READY',
        currency: 'INR',
        grossAmount: 410000,
        eligibleAmount: 390000,
        approvedAmount: 0,
        paidAmount: 0,
        beneficiaryCount: 1,
        readyAt: daysAgo(1),
        dueAt: daysFromNow(5),
        slaState: 'ON_TRACK',
        notes: 'Ready for finance review.',
      },
    ]);

    await ComplianceRecord.insertMany([
      {
        companyId: companyOne._id,
        programId: programOne._id,
        workPackageId: wpNagpur._id,
        agencyId: nagpurAgency._id,
        farmerId: farmerLookup['OPS-DM-004'].farmer._id,
        recordNo: 'CMPREC-001',
        type: 'FINAL_INSPECTION',
        status: 'PASS',
        items: [
          { key: 'site_clean', label: 'Site condition', status: 'PASS', checkedAt: daysAgo(7) },
          { key: 'asset_serials', label: 'Serial capture', status: 'PASS', checkedAt: daysAgo(7) },
          { key: 'commissioning', label: 'Commissioning proof', status: 'PASS', checkedAt: daysAgo(7), evidence: [media('completed-installation-01.png')] },
        ],
        geo: { latitude: 21.112, longitude: 79.007, accuracy: 12, capturedAt: daysAgo(7) },
        reviewedBy: companyUsers.c1_quality._id,
        reviewedAt: daysAgo(7),
        notes: 'Inspection passed without observations.',
      },
      {
        companyId: companyOne._id,
        programId: programOne._id,
        workPackageId: wpNagpur._id,
        agencyId: nagpurAgency._id,
        farmerId: farmerLookup['OPS-DM-005'].farmer._id,
        recordNo: 'CMPREC-002',
        type: 'SERVICE',
        status: 'IN_REVIEW',
        items: [
          { key: 'root_cause', label: 'Root cause documented', status: 'PENDING' },
          { key: 'photo_evidence', label: 'Service photo evidence', status: 'PASS', evidence: [media('service-visit-01.png')] },
        ],
        notes: 'Awaiting corrective action closeout.',
      },
    ]);

    await ApprovalRequest.insertMany([
      {
        companyId: companyOne._id,
        requestNo: 'APR-001',
        type: 'CLAIM_EXCEPTION',
        title: 'Approve dispatch-age waiver for claim packet',
        description: 'One dispatch document carried revised timestamp after system sync.',
        entityType: 'CommercialClaim',
        requestedBy: companyUsers.c1_finance._id,
        status: 'PENDING',
        payload: { claimNo: 'CLM-SKEPL-001' },
      },
      {
        companyId: companyTwo._id,
        requestNo: 'APR-002',
        type: 'COMPLIANCE_WAIVER',
        title: 'Temporary waiver for controller calibration observation',
        description: 'Pune demo installation pending OEM calibration visit.',
        entityType: 'ComplianceRecord',
        requestedBy: companyUsers.c2_quality._id,
        status: 'APPROVED',
        decidedBy: companyUsers.c2_owner._id,
        decidedAt: daysAgo(1),
        decisionReason: 'Approved for demo cycle only.',
      },
    ]);

    await Notification.insertMany([
      { companyId: companyOne._id, recipientUserId: companyUsers.c1_ops._id, recipientRoles: [], type: 'WARNING', title: 'Complaint nearing SLA', message: 'SC-SKEPL-001 is due within 24 hours.', entityType: 'ServiceCase', isRead: false, createdBy: companyUsers.c1_quality._id },
      { companyId: companyOne._id, recipientUserId: companyUsers.c1_logistics._id, recipientRoles: [], type: 'INFO', title: 'Shipment in transit', message: 'SHP-SKEPL-002 is moving toward Nashik agency.', entityType: 'Shipment', isRead: false, createdBy: companyUsers.c1_admin._id },
      { companyId: companyTwo._id, recipientUserId: companyUsers.c2_inventory._id, recipientRoles: [], type: 'SUCCESS', title: 'Agency receipt confirmed', message: 'SHP-AVSIL-001 delivered successfully.', entityType: 'Shipment', isRead: true, readAt: daysAgo(11), createdBy: companyUsers.c2_admin._id },
      { companyId: companyOne._id, recipientRoles: ['finance_user','company_owner','company_admin'], type: 'ACTION', title: 'Claim packet ready for review', message: 'CLM-SKEPL-001 requires finance follow-up before the review deadline.', entityType: 'CommercialClaim', isRead: false, createdBy: companyUsers.c1_admin._id },
      { companyId: companyOne._id, recipientRoles: ['quality_user','operations_manager','company_owner','company_admin'], type: 'WARNING', title: 'Service case needs closeout evidence', message: 'SC-SKEPL-001 is nearing SLA and needs corrective-action evidence.', entityType: 'ServiceCase', actionUrl:'?page=service-cases', isRead: false, createdBy: companyUsers.c1_quality._id },
      { companyId: companyOne._id, recipientRoles: ['operations_manager','program_manager','company_owner','company_admin'], type: 'ACTION', title: 'Survey backlog requires review', message: 'Two beneficiaries are pending or currently in field survey.', entityType: 'Farmer', actionUrl:'?page=beneficiary-records', isRead: false, createdBy: companyUsers.c1_ops._id },
      { companyId: companyOne._id, recipientRoles: ['logistics_manager','operations_manager','company_owner','company_admin'], type: 'INFO', title: 'Material dispatch completed', message: 'A Nagpur beneficiary set has reached the site and is ready for installation scheduling.', entityType: 'Shipment', actionUrl:'?page=shipments', isRead: false, createdBy: companyUsers.c1_logistics._id },
      { companyId: companyOne._id, recipientRoles: ['quality_user','company_owner','company_admin'], type: 'ACTION', title: 'Final inspection queue updated', message: 'Completed installations are ready for evidence and final-inspection review.', entityType: 'ComplianceRecord', actionUrl:'?page=compliance', isRead: false, createdBy: companyUsers.c1_quality._id },
      { companyId: companyOne._id, recipientRoles: ['finance_user','company_owner','company_admin'], type: 'WARNING', title: 'Insurance policy expiring soon', message: 'INS-SKEPL-2026-0002 expires within 30 days.', entityType: 'InsurancePolicy', actionUrl:'?page=insurance', isRead: false, createdBy: companyUsers.c1_finance._id },
    ]);

    await DocumentRecord.insertMany([
      { companyId: companyOne._id, category: 'CONTRACT', title: 'LOA - Lot A Maharashtra', documentNo: contractOne.number, entityType: 'Contract', entityId: contractOne._id, fileUrl: media('survey-site-01.png'), fileName: 'loa-demo.pdf', mimeType: 'application/pdf', size: 234567, uploadedBy: companyUsers.c1_admin._id, notes: 'Demo placeholder document.' },
      { companyId: companyOne._id, category: 'INSPECTION', title: 'Final inspection photo set', documentNo: 'INSP-001', entityType: 'Farmer', entityId: farmerLookup['OPS-DM-004'].farmer._id, fileUrl: media('completed-installation-01.png'), fileName: 'inspection-photo.png', mimeType: 'image/png', size: 356789, uploadedBy: companyUsers.c1_quality._id },
      { companyId: companyTwo._id, category: 'SERVICE', title: 'Controller calibration support evidence', documentNo: 'SRV-001', entityType: 'ServiceCase', fileUrl: media('service-visit-01.png'), fileName: 'service-photo.png', mimeType: 'image/png', size: 329001, uploadedBy: companyUsers.c2_quality._id },
    ]);

    await SLARule.insertMany([
      { companyId: companyOne._id, programId: programOne._id, name: 'Complaint SLA - High', appliesTo: 'SERVICE_CASE', caseType: 'COMPLAINT', priority: 'HIGH', targetHours: 48, warningHours: 12, isActive: true, createdBy: companyUsers.c1_admin._id },
      { companyId: companyOne._id, programId: programOne._id, name: 'Installation SLA', appliesTo: 'INSTALLATION', targetHours: 120, warningHours: 24, isActive: true, createdBy: companyUsers.c1_admin._id },
      { companyId: companyTwo._id, programId: programTwo._id, name: 'Final Inspection SLA', appliesTo: 'FINAL_INSPECTION', targetHours: 72, warningHours: 12, isActive: true, createdBy: companyUsers.c2_admin._id },
    ]);

    await MasterDataEntry.insertMany([
      {companyId:companyOne._id,domain:'GEOGRAPHY',type:'STATE',code:'MH',label:'Maharashtra',sortOrder:1},
      {companyId:companyOne._id,domain:'GEOGRAPHY',type:'DISTRICT',code:'NAGPUR',label:'Nagpur',parentCode:'MH',sortOrder:1},
      {companyId:companyOne._id,domain:'GEOGRAPHY',type:'DISTRICT',code:'NASHIK',label:'Nashik',parentCode:'MH',sortOrder:2},
      {companyId:companyOne._id,domain:'SUPPLY_CHAIN',type:'BRAND',code:'HELIOFLOW',label:'HelioFlow',sortOrder:1},
      {companyId:companyOne._id,domain:'FIELD_OPERATIONS',type:'PUMP_CAPACITY',code:'5HP',label:'5 HP',sortOrder:1},
      {companyId:companyOne._id,domain:'COMMERCIAL',type:'SCHEME',code:'PMKUSUM',label:'PM-KUSUM',sortOrder:1}
    ]);
    const evidenceReqs=await EvidenceRequirement.insertMany([
      {companyId:companyOne._id,programId:programOne._id,stage:'SURVEY',key:'site_photo',label:'Site / water-source photo',evidenceType:'PHOTO',required:true,minFiles:1,sortOrder:1},
      {companyId:companyOne._id,programId:programOne._id,stage:'SURVEY',key:'farmer_consent',label:'Farmer consent / declaration',evidenceType:'DOCUMENT',required:true,minFiles:1,sortOrder:2},
      {companyId:companyOne._id,programId:programOne._id,stage:'INSTALLATION',key:'mounting_structure',label:'Mounting structure photo',evidenceType:'PHOTO',required:true,minFiles:1,sortOrder:1},
      {companyId:companyOne._id,programId:programOne._id,stage:'INSTALLATION',key:'farmer_with_system',label:'Farmer with installed system',evidenceType:'PHOTO',required:true,minFiles:1,sortOrder:2},
      {companyId:companyOne._id,programId:programOne._id,stage:'FINAL_INSPECTION',key:'commissioning_proof',label:'Commissioning / water discharge proof',evidenceType:'PHOTO',required:true,minFiles:1,sortOrder:1}
    ]);
    const demoInstalledFarmer=farmerLookup['OPS-DM-004'].farmer;
    const [demoLat,demoLng]=String(demoInstalledFarmer.siteLocation||'').split(',').map(Number);
    const demoGeo={latitude:demoLat,longitude:demoLng,accuracy:8,capturedAt:daysAgo(7),source:'DEMO',capturedByUserId:agencyUsers.nagpur_tech_1._id,capturedByName:agencyUsers.nagpur_tech_1.username,capturedByRole:'field_technician'};
    await EvidenceSubmission.insertMany(evidenceReqs.map((r,i)=>({companyId:companyOne._id,farmerId:demoInstalledFarmer._id,workPackageId:wpNagpur._id,agencyId:nagpurAgency._id,requirementId:r._id,stage:r.stage,status:'VERIFIED',captureGeo:demoGeo,files:[{url:i<2?media('survey-site-01.png'):i<4?media('installation-progress-01.png'):media('completed-installation-01.png'),name:`demo-evidence-${i+1}.png`,mimeType:'image/png',geo:demoGeo}],submittedByLegacyUser:agencyUsers.nagpur_tech_1._id,verifiedBy:companyUsers.c1_quality._id,verifiedAt:daysAgo(6),notes:'Verified geo-tagged demo evidence'})));
    const geoDemoFarmers=['OPS-DM-012','OPS-DM-015','OPS-DM-018','OPS-DM-021'];
    for(let gi=0;gi<geoDemoFarmers.length;gi++){const fe=farmerLookup[geoDemoFarmers[gi]];if(!fe)continue;const [lat,lng]=String(fe.farmer.siteLocation||'').split(',').map(Number);const req=evidenceReqs[gi%evidenceReqs.length];const geoTag={latitude:lat,longitude:lng,accuracy:10+gi,capturedAt:daysAgo(4+gi),source:'DEMO',capturedByUserId:fe.wp.code==='WP-NAG-001'?agencyUsers.nagpur_tech_2._id:agencyUsers.nashik_tech_1._id,capturedByName:fe.wp.code==='WP-NAG-001'?agencyUsers.nagpur_tech_2.username:agencyUsers.nashik_tech_1.username,capturedByRole:'field_technician'};await EvidenceSubmission.create({companyId:fe.company._id,farmerId:fe.farmer._id,workPackageId:fe.wp._id,agencyId:fe.agency._id,requirementId:req._id,stage:req.stage,status:gi===2?'SUBMITTED':'VERIFIED',captureGeo:geoTag,files:[{url:media(gi%2===0?'survey-site-02.jpg':'installation-progress-02.jpg'),name:`geo-demo-${gi+1}.jpg`,mimeType:'image/jpeg',geo:geoTag}],submittedByLegacyUser:geoTag.capturedByUserId,verifiedBy:gi===2?undefined:companyUsers.c1_quality._id,verifiedAt:gi===2?undefined:daysAgo(2),notes:'Geo-tagged field evidence for map demonstration.'});}

    const insuredAsset=installedAssets.find(a=>a.farmerId.equals(farmerLookup['OPS-DM-004'].farmer._id));
    const complaintInsuredAsset=installedAssets.find(a=>a.farmerId.equals(farmerLookup['OPS-DM-005'].farmer._id));
    await InsurancePolicy.insertMany([
      {companyId:companyOne._id,farmerId:farmerLookup['OPS-DM-004'].farmer._id,installedAssetId:insuredAsset?._id,policyNumber:'INS-SKEPL-2026-0001',referenceNumber:'REF-INS-001',insurer:'Bharat Rural General Insurance',policyType:'COMPREHENSIVE',coverageAmount:425000,premiumAmount:6200,currency:'INR',startDate:daysAgo(7),endDate:daysFromNow(358),status:'ACTIVE',documentUrl:media('completed-installation-01.png'),documentFileName:'demo-policy-0001.pdf',notes:'Demo comprehensive asset coverage.',createdBy:companyUsers.c1_finance._id},
      {companyId:companyOne._id,farmerId:farmerLookup['OPS-DM-005'].farmer._id,installedAssetId:complaintInsuredAsset?._id,policyNumber:'INS-SKEPL-2026-0002',referenceNumber:'REF-INS-002',insurer:'Bharat Rural General Insurance',policyType:'PUMP',coverageAmount:185000,premiumAmount:3100,currency:'INR',startDate:daysAgo(8),endDate:daysFromNow(22),status:'EXPIRING',documentUrl:media('service-visit-01.png'),documentFileName:'demo-policy-0002.pdf',claimNumber:'IC-2026-0091',claimStatus:'Surveyor assigned',claimOpenedAt:daysAgo(1),notes:'Demo policy nearing expiry with claim context.',createdBy:companyUsers.c1_finance._id}
    ]);

    await PDIRecord.insertMany([
      {companyId:companyOne._id,pdiNumber:'PDI-SKEPL-0001',itemId:itemMap['PUMP-5HP']._id,inventorySerialId:serialMap['P5-NAG-005']._id,supplierName:'HelioFlow Manufacturing',brand:'HelioFlow',model:'HF-5',inspectionDate:daysAgo(20),inspectedBy:companyUsers.c1_quality._id,result:'PASS',checklist:[{key:'identity',label:'Serial/model identity verified',status:'PASS'},{key:'physical',label:'Physical condition inspected',status:'PASS'},{key:'electrical',label:'Electrical/functional checks completed',status:'PASS'},{key:'label',label:'Manufacturer label and barcode readable',status:'PASS'}],evidenceUrls:[media('site-verification-01.png')],certificateUrl:media('site-verification-01.png'),disposition:'WAREHOUSE_ACCEPT',warehouseId:warehouseMap['WH-NAG-CEN']._id,notes:'Demo PDI passed and released to stock.'},
      {companyId:companyOne._id,pdiNumber:'PDI-SKEPL-0002',itemId:itemMap['CTRL-SMART']._id,inventorySerialId:serialMap['C1-NAG-005']._id,supplierName:'SunMesh Controls',brand:'SunMesh',model:'SM-CTRL',inspectionDate:daysAgo(18),inspectedBy:companyUsers.c1_quality._id,result:'HOLD',checklist:[{key:'identity',label:'Serial/model identity verified',status:'PASS'},{key:'physical',label:'Physical condition inspected',status:'PASS'},{key:'electrical',label:'Electrical/functional checks completed',status:'PENDING',notes:'Firmware validation pending'},{key:'label',label:'Manufacturer label and barcode readable',status:'PASS'}],evidenceUrls:[media('service-visit-01.png')],disposition:'HOLD_FOR_REWORK',warehouseId:warehouseMap['WH-NAG-CEN']._id,notes:'Held for firmware validation.'}
    ]);

    await AuditLog.insertMany([
      { companyId: companyOne._id, organizationId: companyOne._id, actorId: companyUsers.c1_admin._id, actorType: 'PlatformUser', action: 'DEMO_SEED_COMPLETED', entityType: 'Organization', entityId: companyOne._id, after: { farmers: 21, workPackages: 2, shipments: 2, geoTaggedEvidence: 9 } },
      { companyId: companyTwo._id, organizationId: companyTwo._id, actorId: companyUsers.c2_admin._id, actorType: 'PlatformUser', action: 'DEMO_SEED_COMPLETED', entityType: 'Organization', entityId: companyTwo._id, after: { farmers: 3, workPackages: 1, shipments: 1, geoTaggedEvidence: 0 } },
    ]);

    console.log('✓ Opsynq demo data seeded successfully');
    console.log(`✓ Shared demo password for seeded non-env demo accounts: ${DEMO_PASSWORD}`);
    console.log('✓ Platform demo companies: SKEPL, AVSIL');
    console.log('✓ Agency demo orgs: NAGFOPS, NASRINS, PUNESVC');
    console.log('✓ Rich demo data created across operations, inventory, logistics, insurance, PDI, regulatory reporting, service, claims, compliance, documents, notifications and agency workflow.');
  } catch (error) {
    console.error('Demo seed failed:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
})();
