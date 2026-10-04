const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

const { validateTarget, cleanupKnownDemoRmsBootstrap } = require('../scripts/demoDbGuard');

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

const { loadManifest, assetUrl, publicIdMap } = require('./demoMediaSpec');
// Fail before any database write when the real-photo bundle has not been uploaded.
// This prevents the previous synthetic/broken /demo-media URL behavior.
const DEMO_MEDIA = loadManifest({ required: true });
const demoMedia = (beneficiaryId, kind) => assetUrl(DEMO_MEDIA, beneficiaryId, kind);
const entityMedia = () => '';
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
  { key: 'haryana_superadmin', username: 'haryana.superadmin', email: 'haryana.superadmin@opsynq.demo', mobile: '9500000001', role: 'superadmin' },
  { key: 'haryana_admin', username: 'haryana.admin', email: 'haryana.admin@opsynq.demo', mobile: '9500000002', role: 'admin' },
  { key: 'haryana_tech_1', username: 'haryana.tech01', email: 'haryana.tech01@opsynq.demo', mobile: '9500000003', role: 'field_technician' },
  { key: 'haryana_tech_2', username: 'haryana.tech02', email: 'haryana.tech02@opsynq.demo', mobile: '9500000004', role: 'field_technician' },
];

async function requireOrganization({ code, type, parentOrganization = null }) {
  const existing = await Organization.findOne({ code });
  if (!existing) throw new Error(`Required existing demo organization is missing (${code}). No tenant was created by the demo seed.`);
  if (String(existing.type) !== String(type)) throw new Error(`Organization ${code} type mismatch (${existing.type} != ${type}). Refusing to change tenant identity.`);
  if (parentOrganization && String(existing.parentOrganization || '') !== String(parentOrganization)) {
    throw new Error(`Organization ${code} parent mapping mismatch. Refusing to change tenant hierarchy.`);
  }
  return existing;
}

async function requirePlatformUser(payload) {
  const existing = await PlatformUser.findOne({ mobile: payload.mobile });
  if (!existing) throw new Error(`Required existing demo platform account is missing (${payload.mobile}, ${payload.role}). No login was created; restore/approve the demo account before seeding.`);
  const expectedEmail = String(payload.email || '').toLowerCase();
  if (String(existing.role) !== String(payload.role) || String(existing.email || '').toLowerCase() !== expectedEmail || String(existing.organizationId || '') !== String(payload.organizationId || '')) {
    throw new Error(`Existing demo platform account mapping does not match the seed contract (${payload.mobile}). Refusing to change role/email/tenant mapping.`);
  }
  return existing;
}

async function requireLegacyUser(payload) {
  const existing = await User.findOne({ mobile: payload.mobile });
  if (!existing) throw new Error(`Required existing Agency/Technician demo account is missing (${payload.mobile}, ${payload.role}). No login was created; restore/approve the demo account before seeding.`);
  if (String(existing.role) !== String(payload.role) || String(existing.email || '').toLowerCase() !== String(payload.email || '').toLowerCase() || String(existing.username || '') !== String(payload.username || '')) {
    throw new Error(`Existing Agency/Technician demo account identity does not match the seed contract (${payload.mobile}). Refusing to change credentials or role.`);
  }
  return existing;
}

(async () => {
  try {
    // Safety gate first. During an explicitly-authorized destructive demo reset,
    // a running RMS dashboard can auto-recreate only its DEMO bootstrap provider/rules
    // after wipe and before seed. Clean that narrow, verified race-condition state only;
    // any other data still causes a hard block.
    if (String(process.env.OPSYNQ_ALLOW_DESTRUCTIVE_DEMO_RESET || '') === 'YES') {
      console.log('[demo-seed] guarded DEMO RMS bootstrap cleanup enabled');
      const cleaned = await cleanupKnownDemoRmsBootstrap();
      console.log(`[demo-seed] RMS bootstrap cleanup complete (providers=${cleaned.providers}, rules=${cleaned.rules})`);
    }
    await validateTarget({ destructive: false, write: true, requireClean: true });

    const platformOrg = await requireOrganization({ code: 'OPSYNQ', type: 'PLATFORM' });

    const companyOne = await requireOrganization({
      code: 'SKEPL',
      type: 'COMPANY',
      parentOrganization: platformOrg._id,
    });

    const companyTwo = await requireOrganization({
      code: 'AVSIL',
      type: 'COMPANY',
      parentOrganization: platformOrg._id,
    });

    const nagpurAgency = await requireOrganization({
      code: 'NAGFOPS',
      type: 'AGENCY',
      parentOrganization: companyOne._id,
    });

    const nashikAgency = await requireOrganization({
      code: 'NASRINS',
      type: 'AGENCY',
      parentOrganization: companyOne._id,
    });

    const puneAgency = await requireOrganization({
      code: 'PUNESVC',
      type: 'AGENCY',
      parentOrganization: companyTwo._id,
    });

    const haryanaAgency = await requireOrganization({
      code: 'HRYOPS',
      type: 'AGENCY',
      parentOrganization: companyOne._id,
    });


    const companyUsers = {};
    for (const definition of DEMO_PLATFORM_USERS) {
      const organizationId = definition.key.startsWith('c1_') ? companyOne._id : companyTwo._id;
      const lastLocation = definition.key.startsWith('c1_')
        ? geo(21.1458, 79.0882, 'Nagpur HQ')
        : geo(18.5204, 73.8567, 'Pune HQ');
      companyUsers[definition.key] = await requirePlatformUser({ ...definition, organizationId, lastLocation });
    }

    const agencyUsers = {};
    for (const definition of DEMO_AGENCY_USERS) {
      let lastLocation = geo(21.1458, 79.0882, 'Nagpur district');
      if (definition.key.startsWith('nashik_')) lastLocation = geo(20.0110, 73.7903, 'Nashik district');
      if (definition.key.startsWith('pune_')) lastLocation = geo(18.5204, 73.8567, 'Pune district');
      if (definition.key.startsWith('haryana_')) lastLocation = geo(29.6857, 76.9905, 'Karnal, Haryana');
      agencyUsers[definition.key] = await requireLegacyUser({ ...definition, lastLocation });
    }

    const agencyLinks = [
      [nagpurAgency, 'nagpur_superadmin'], [nagpurAgency, 'nagpur_admin'], [nagpurAgency, 'nagpur_tech_1'], [nagpurAgency, 'nagpur_tech_2'],
      [nashikAgency, 'nashik_superadmin'], [nashikAgency, 'nashik_admin'], [nashikAgency, 'nashik_tech_1'], [nashikAgency, 'nashik_tech_2'],
      [puneAgency, 'pune_superadmin'], [puneAgency, 'pune_admin'], [puneAgency, 'pune_tech_1'],
      [haryanaAgency, 'haryana_superadmin'], [haryanaAgency, 'haryana_admin'], [haryanaAgency, 'haryana_tech_1'], [haryanaAgency, 'haryana_tech_2'],
    ];
    for (const [agency, userKey] of agencyLinks) {
      const companyId = String(agency.parentOrganization) === String(companyTwo._id) ? companyTwo._id : companyOne._id;
      const existingLink = await AgencyUserLink.findOne({ legacyUserId: agencyUsers[userKey]._id, agencyId: agency._id, companyId });
      if (!existingLink || !existingLink.isActive || String(existingLink.role) !== String(agencyUsers[userKey].role)) {
        throw new Error(`Required existing Agency tenant mapping is missing or inconsistent for ${agencyUsers[userKey].mobile}. Refusing to create/change account mapping during demo seed.`);
      }
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
        companyId: companyOne._id,
        name: 'PM-KUSUM Demo Haryana 2026',
        code: 'PMK-2026-HR',
        country: 'India',
        state: 'Haryana',
        authority: 'Haryana Renewable Demo Authority',
        scheme: 'PM-KUSUM',
        component: 'Solar Irrigation Pumps',
        financialYear: '2026-27',
        sanctionedQuantity: 180,
        contractValue: 69000000,
        status: 'ACTIVE',
        startDate: daysAgo(65),
        endDate: daysFromNow(260),
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
    const programHaryana = programs[1];
    const programTwo = programs[2];

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
        companyId: companyOne._id,
        programId: programHaryana._id,
        type: 'LOA',
        number: 'SKEPL/PMK/HR/2026/001',
        title: 'Haryana Solar Irrigation Demonstration Cluster',
        authority: 'Haryana Renewable Demo Authority',
        sanctionedQuantity: 180,
        contractValue: 69000000,
        awardDate: daysAgo(72),
        startDate: daysAgo(65),
        endDate: daysFromNow(260),
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
    const contractHaryana = contracts[1];
    const contractTwo = contracts[2];

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
        companyId: companyOne._id,
        programId: programHaryana._id,
        contractId: contractHaryana._id,
        number: 'WO-SKEPL-HR-001',
        title: 'Haryana Pilot Solar Pump Installations',
        loaNumber: contractHaryana.number,
        sanctionedQuantity: 80,
        contractValue: 31000000,
        startDate: daysAgo(55),
        dueDate: daysFromNow(145),
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
    const workOrderHaryana = workOrders[1];
    const workOrderTwo = workOrders[2];

    const workPackages = await WorkPackage.insertMany([
      {
        companyId: companyOne._id,
        programId: programOne._id,
        workOrderId: workOrderOne._id,
        code: 'WP-NAG-001',
        name: 'Nagpur Rural Package',
        agencyId: nagpurAgency._id,
        geography: { country: 'India', state: 'Maharashtra', district: 'Nagpur', taluka: 'Hingna', villages: ['Wanadongri', 'Gumgaon', 'Dhamna'] },
        assignedQuantity: 11,
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
        assignedQuantity: 5,
        assignedAt: daysAgo(52),
        dueDate: daysFromNow(55),
        status: 'IN_PROGRESS',
      },
      {
        companyId: companyOne._id,
        programId: programHaryana._id,
        workOrderId: workOrderHaryana._id,
        code: 'WP-HR-001',
        name: 'Haryana Multi-District Demo Package',
        agencyId: haryanaAgency._id,
        geography: { country: 'India', state: 'Haryana', district: 'Karnal', taluka: 'Karnal', villages: ['Gharaunda', 'Nilokheri', 'Assandh', 'Indri'] },
        assignedQuantity: 10,
        assignedAt: daysAgo(42),
        dueDate: daysFromNow(75),
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
        assignedQuantity: 3,
        assignedAt: daysAgo(40),
        dueDate: daysFromNow(70),
        status: 'ASSIGNED',
      },
    ]);
    const [wpNagpur, wpNashik, wpHaryana, wpPune] = workPackages;

    const importBatches = await ImportBatch.insertMany([
      {
        companyId: companyOne._id,
        type: 'BENEFICIARY_MASTER',
        sourceFileName: 'nagpur-beneficiaries-demo.xlsx',
        fileHash: 'demo-nagpur-batch',
        status: 'COMPLETED',
        totalRows: 11,
        successRows: 11,
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
        totalRows: 5,
        successRows: 5,
        failedRows: 0,
        skippedRows: 0,
        uploadedBy: companyUsers.c1_admin._id,
      },
      {
        companyId: companyOne._id,
        type: 'BENEFICIARY_MASTER',
        sourceFileName: 'haryana-beneficiaries-demo.xlsx',
        fileHash: 'demo-haryana-batch',
        status: 'COMPLETED',
        totalRows: 10,
        successRows: 10,
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
        totalRows: 3,
        successRows: 3,
        failedRows: 0,
        skippedRows: 0,
        uploadedBy: companyUsers.c2_admin._id,
      },
    ]);

    const farmersPayload = [
      ['OPS-DM-001', 'Bharat Wankhede', '9823011001', 'Nagpur', 'Hingna', 'Wanadongri', wpNagpur, nagpurAgency, companyOne, programOne, workOrderOne, 'Pending', 'Pending', ''],
      ['OPS-DM-002', 'Suresh Meshram', '9823011002', 'Nagpur', 'Hingna', 'Gumgaon', wpNagpur, nagpurAgency, companyOne, programOne, workOrderOne, 'Pending', 'In Progress', 'Survey visit in progress'],
      ['OPS-DM-003', 'Lata Gaikwad', '9823011003', 'Nagpur', 'Hingna', 'Dhamna', wpNagpur, nagpurAgency, companyOne, programOne, workOrderOne, 'Ordered', 'Completed', ''],
      ['OPS-DM-004', 'Ramesh Atram', '9823011004', 'Nagpur', 'Katol', 'Kalmeshwar', wpNagpur, nagpurAgency, companyOne, programOne, workOrderOne, 'Installation Completed', 'Completed', ''],
      ['OPS-DM-005', 'Savita Dhoble', '9823011005', 'Nagpur', 'Saoner', 'Kandri', wpNagpur, nagpurAgency, companyOne, programOne, workOrderOne, 'Installation Completed', 'Completed', 'Motor tripping frequently'],
      ['OPS-DM-006', 'Dilip Khandekar', '9823011006', 'Nashik', 'Sinnar', 'Nandur Shingote', wpNashik, nashikAgency, companyOne, programOne, workOrderOne, 'Closed', 'Completed', ''],
      ['OPS-DM-007', 'Geeta Ahire', '9823011007', 'Nashik', 'Sinnar', 'Pangri', wpNashik, nashikAgency, companyOne, programOne, workOrderOne, 'Pending', 'Completed', ''],
      ['OPS-DM-008', 'Mahesh Sonawane', '9823011008', 'Nashik', 'Sinnar', 'Dubere', wpNashik, nashikAgency, companyOne, programOne, workOrderOne, 'Dispatch Completed', 'Completed', ''],
      ['OPS-DM-009', 'Shobha Chavan', '9823011009', 'Pune', 'Baramati', 'Morgaon', wpPune, puneAgency, companyTwo, programTwo, workOrderTwo, 'Pending', 'Pending', ''],
      ['OPS-DM-010', 'Vishal Jagtap', '9823011010', 'Pune', 'Baramati', 'Katewadi', wpPune, puneAgency, companyTwo, programTwo, workOrderTwo, 'Pending', 'Completed', ''],
      ['OPS-DM-011', 'Anita More', '9823011011', 'Pune', 'Baramati', 'Pandharewadi', wpPune, puneAgency, companyTwo, programTwo, workOrderTwo, 'Ready for Installation', 'Completed', ''],
      ['OPS-DM-012', 'Prakash Bawane', '9823011012', 'Nagpur', 'Hingna', 'Isasani', wpNagpur, nagpurAgency, companyOne, programOne, workOrderOne, 'Pending', 'Pending', 'Registration documents under review'],
      ['OPS-DM-013', 'Meena Khobragade', '9823011013', 'Nagpur', 'Kalmeshwar', 'Borgaon', wpNagpur, nagpurAgency, companyOne, programOne, workOrderOne, 'Move to Installation', 'Completed', ''],
      ['OPS-DM-014', 'Nitin Uikey', '9823011014', 'Nagpur', 'Saoner', 'Khapa', wpNagpur, nagpurAgency, companyOne, programOne, workOrderOne, 'Ready for Installation', 'Completed', 'Installation crew mobilized'],
      ['OPS-DM-015', 'Sunanda Raut', '9823011015', 'Nagpur', 'Katol', 'Yenwa', wpNagpur, nagpurAgency, companyOne, programOne, workOrderOne, 'Installation Completed', 'Completed', ''],
      ['OPS-DM-016', 'Arun Shende', '9823011016', 'Nagpur', 'Ramtek', 'Mansar', wpNagpur, nagpurAgency, companyOne, programOne, workOrderOne, 'Closed', 'Completed', ''],
      ['OPS-DM-017', 'Kalpana Pawar', '9823011017', 'Nashik', 'Sinnar', 'Musalgaon', wpNashik, nashikAgency, companyOne, programOne, workOrderOne, 'Pending', 'Pending', 'Land document pending'],
      ['OPS-DM-018', 'Ganesh Jadhav', '9823011018', 'Nashik', 'Niphad', 'Lasalgaon', wpNashik, nashikAgency, companyOne, programOne, workOrderOne, 'Pending', 'In Progress', 'Water-source verification pending'],
      ['OPS-DM-019', 'Madhukar Zade', '9823011019', 'Nagpur', 'Hingna', 'Gumgaon', wpNagpur, nagpurAgency, companyOne, programOne, workOrderOne, 'Closed', 'Completed', ''],
      ['OPS-HR-020', 'Sandeep Malik', '9812012020', 'Karnal', 'Karnal', 'Gharaunda', wpHaryana, haryanaAgency, companyOne, programHaryana, workOrderHaryana, 'Pending', 'Pending', 'Registration completed'],
      ['OPS-HR-021', 'Sunita Devi', '9812012021', 'Karnal', 'Indri', 'Kheri Man Singh', wpHaryana, haryanaAgency, companyOne, programHaryana, workOrderHaryana, 'Pending', 'Pending', 'Documents under review'],
      ['OPS-HR-022', 'Rajesh Kumar', '9812012022', 'Panipat', 'Samalkha', 'Bapoli', wpHaryana, haryanaAgency, companyOne, programHaryana, workOrderHaryana, 'Pending', 'In Progress', 'Survey visit scheduled'],
      ['OPS-HR-023', 'Poonam Rani', '9812012023', 'Kurukshetra', 'Shahbad', 'Babain', wpHaryana, haryanaAgency, companyOne, programHaryana, workOrderHaryana, 'Pending', 'Completed', 'Survey approved'],
      ['OPS-HR-024', 'Mahender Singh', '9812012024', 'Karnal', 'Nilokheri', 'Taraori', wpHaryana, haryanaAgency, companyOne, programHaryana, workOrderHaryana, 'Ordered', 'Completed', 'Material order approved'],
      ['OPS-HR-025', 'Kavita Rani', '9812012025', 'Kaithal', 'Pundri', 'Fatehpur', wpHaryana, haryanaAgency, companyOne, programHaryana, workOrderHaryana, 'Dispatch Completed', 'Completed', 'Material dispatched'],
      ['OPS-HR-026', 'Virender Dahiya', '9812012026', 'Sonipat', 'Gohana', 'Mundlana', wpHaryana, haryanaAgency, companyOne, programHaryana, workOrderHaryana, 'Move to Installation', 'Completed', 'Ready for installation allocation'],
      ['OPS-HR-027', 'Rekha Devi', '9812012027', 'Hisar', 'Hansi', 'Sisar', wpHaryana, haryanaAgency, companyOne, programHaryana, workOrderHaryana, 'Ready for Installation', 'Completed', 'Crew mobilization pending'],
      ['OPS-HR-028', 'Deepak Hooda', '9812012028', 'Rohtak', 'Sampla', 'Ismaila', wpHaryana, haryanaAgency, companyOne, programHaryana, workOrderHaryana, 'Closed', 'Completed', 'Fully commissioned Haryana demo site'],
      ['OPS-HR-029', 'Balwan Singh', '9812012029', 'Karnal', 'Assandh', 'Jalmana', wpHaryana, haryanaAgency, companyOne, programHaryana, workOrderHaryana, 'Closed', 'Completed', 'Fully commissioned Haryana demo site'],
    ];

    const demoCoordinates={Nagpur:[21.1458,79.0882],Nashik:[19.9975,73.7898],Pune:[18.5204,73.8567],Karnal:[29.6857,76.9905],Panipat:[29.3909,76.9635],Kurukshetra:[29.9695,76.8783],Kaithal:[29.8015,76.3996],Sonipat:[28.9931,77.0151],Hisar:[29.1492,75.7217],Rohtak:[28.8955,76.6066]};
    const demoFieldTeamByPackage={
      'WP-NAG-001':{technicians:[{username:'nagpur.tech01',mobile:'9200000003'},{username:'nagpur.tech02',mobile:'9200000004'}],admin:'nagpur.admin'},
      'WP-NAS-001':{technicians:[{username:'nashik.tech01',mobile:'9300000003'},{username:'nashik.tech02',mobile:'9300000004'}],admin:'nashik.admin'},
      'WP-PUN-001':{technicians:[{username:'pune.tech01',mobile:'9400000003'}],admin:'pune.admin'},
      'WP-HR-001':{technicians:[{username:'haryana.tech01',mobile:'9500000003'},{username:'haryana.tech02',mobile:'9500000004'}],admin:'haryana.admin'},
    };
    const stageGroupById = {
      'OPS-DM-001':'NEW','OPS-DM-009':'NEW','OPS-DM-012':'NEW',
      'OPS-DM-002':'SURVEY','OPS-DM-007':'SURVEY','OPS-DM-010':'SURVEY',
      'OPS-DM-003':'PROCESSING','OPS-DM-008':'PROCESSING','OPS-DM-011':'PROCESSING','OPS-DM-013':'PROCESSING','OPS-DM-014':'PROCESSING',
      'OPS-DM-004':'COMPLETED','OPS-DM-005':'COMPLETED','OPS-DM-006':'COMPLETED','OPS-DM-015':'COMPLETED','OPS-DM-016':'COMPLETED','OPS-DM-019':'COMPLETED',
      'OPS-DM-017':'ON_HOLD','OPS-DM-018':'REJECTED',
      'OPS-HR-020':'NEW','OPS-HR-021':'NEW','OPS-HR-022':'SURVEY','OPS-HR-023':'SURVEY',
      'OPS-HR-024':'PROCESSING','OPS-HR-025':'PROCESSING','OPS-HR-026':'PROCESSING','OPS-HR-027':'PROCESSING','OPS-HR-028':'COMPLETED','OPS-HR-029':'COMPLETED',
    };
    const farmers = [];
    for (let i = 0; i < farmersPayload.length; i += 1) {
      const [beneficiaryId, beneficiaryName, mobile, district, taluka, village, wp, agency, company, program, workOrder, applicationStatus, inspectionStatus, issue] = farmersPayload[i];
      const mediaSet={
        beneficiary:demoMedia(beneficiaryId,'beneficiary'),site:demoMedia(beneficiaryId,'survey-site'),water:demoMedia(beneficiaryId,'water-source'),
        idProof:demoMedia(beneficiaryId,'id-proof'),consent:demoMedia(beneficiaryId,'consent'),signature:demoMedia(beneficiaryId,'signature'),
        before:demoMedia(beneficiaryId,'install-before'),during:demoMedia(beneficiaryId,'install-during'),after:demoMedia(beneficiaryId,'install-after'),
        installOverview:demoMedia(beneficiaryId,'install-overview'),serialPlate:demoMedia(beneficiaryId,'serial-plate'),completion:demoMedia(beneficiaryId,'completion-certificate'),
        finalBeneficiary:demoMedia(beneficiaryId,'final-beneficiary'),finalSignature:demoMedia(beneficiaryId,'final-signature'),
        surveyorSignature:demoMedia(beneficiaryId,'surveyor-signature'),lr:demoMedia(beneficiaryId,'lr'),service:demoMedia(beneficiaryId,'service')
      };
      const stageGroup=stageGroupById[beneficiaryId]||'PROCESSING';
      const hasSurveyStarted=inspectionStatus!=='Pending';
      const hasSurvey=inspectionStatus==='Completed';
      const hasOrder=['Ordered','Dispatch Completed','Move to Installation','Ready for Installation','Installation Completed','Complaint Raised','Closed'].includes(applicationStatus);
      const hasMaterial=['Dispatch Completed','Move to Installation','Ready for Installation','Installation Completed','Complaint Raised','Closed'].includes(applicationStatus);
      const hasInstalled=['Installation Completed','Complaint Raised','Closed'].includes(applicationStatus);
      const installationEvidenceAllowed=hasInstalled||beneficiaryId==='OPS-DM-014';
      const installationAssigned=['PROCESSING','COMPLETED'].includes(stageGroup);
      const isComplaintDemo=beneficiaryId==='OPS-DM-005';
      const baseGeo=demoCoordinates[district]||[20.5,78.9],latitude=Number((baseGeo[0]+((i%5)-2)*0.018).toFixed(6)),longitude=Number((baseGeo[1]+((i%4)-1.5)*0.021).toFixed(6));
      const fieldTeam=demoFieldTeamByPackage[wp.code]||demoFieldTeamByPackage['WP-NAG-001'];
      const assignedTech=fieldTeam.technicians[i%fieldTeam.technicians.length];
      const lifecycleEdge=beneficiaryId==='OPS-DM-017'?'ON_HOLD':beneficiaryId==='OPS-DM-018'?'REJECTED':'';
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
        siteDepth: hasSurveyStarted ? `${120 + i * 5}` : '',
        inspectionStatus,
        inspectionStatusFinal: hasInstalled ? 'SYSTEM DETAILS SUBMITTED' : hasSurveyStarted ? 'VENDOR INFORMATION RECEIVED' : '',
        applicationStatus,
        siteLocation: `${latitude},${longitude}`,
        pumpType: i % 2 === 0 ? 'AC Solar Pump' : 'DC Solar Pump',
        pumpHP: i % 2 === 0 ? '5 HP' : '7.5 HP',
        controllerTypeWithOrWithout: 'With Controller',
        assignedVendorCompanyName: company.name,
        vendorAssignmentDate: daysAgo(55 - i),
        surveyorName: assignedTech.username,
        surveyorMobile: assignedTech.mobile,
        sourceType: hasSurveyStarted ? 'Borewell' : '',
        landHoldingAcre: `${3 + (i % 4)}`,
        landOwnershipType: 'Self Owned',
        actualHeadM: hasSurveyStarted ? `${20 + i}` : '',
        sourceDepthFeet: hasSurveyStarted ? `${180 + i * 3}` : '',
        jsrDeviationYesNo: inspectionStatus==='Pending'?'':inspectionStatus==='In Progress'?'VENDOR INFORMATION RECEIVED':'JSR SUBMITTED',
        deviationRemarks: issue&&inspectionStatus!=='Completed'?issue:'',
        surveyDate: hasSurveyStarted?daysAgo(Math.max(2,50-i)):null,
        jsrTechnician: hasSurveyStarted ? assignedTech.username : '',
        materialOnSiteOrWarehouse: hasMaterial ? 'On Site' : hasOrder ? 'Warehouse' : '',
        warehouseInwardDate: hasOrder ? daysAgo(Math.max(2, 30 - i)) : null,
        vehicleNo: hasMaterial ? (district === 'Nagpur' ? 'MH31AB1234' : district === 'Nashik' ? 'MH15ZX4578' : 'MH12PQ9012') : '',
        lotNo: hasOrder ? `LOT-${district.slice(0, 3).toUpperCase()}-${i + 1}` : '',
        fullSetOrPartialSet: hasMaterial ? 'Full Set' : '',
        invoiceNo: hasOrder ? `INV-${beneficiaryId}` : '',
        waybillNoFromCompany: hasMaterial ? `WB-${beneficiaryId}` : '',
        lot: hasOrder ? `LOT-${i + 1}` : '',
        materialDispatchDate: hasMaterial ? daysAgo(Math.max(1, 20 - i)) : null,
        transporterName: hasMaterial ? 'Opsynq Logistics Demo' : '',
        transporterVehicleNo: hasMaterial ? (district === 'Pune' ? 'MH12DD4455' : 'MH31CC7788') : '',
        materialReceivedConfirmationYesNo: hasMaterial ? 'Yes' : hasOrder ? 'No' : '',
        shortageDamagedRemarks: beneficiaryId==='OPS-DM-014'?'One outer carton received dented; contents verified intact.':'',
        invoiceDate: hasOrder ? daysAgo(Math.max(2, 25 - i)) : null,
        waybillNo: hasMaterial ? `WYB-${beneficiaryId}` : '',
        deliveryChallanNo: hasMaterial ? `DC-${beneficiaryId}` : '',
        installationDate: ['Installation Completed', 'Complaint Raised', 'Closed'].includes(applicationStatus) ? daysAgo(10 + i) : null,
        installationCompletionDate: ['Installation Completed', 'Complaint Raised', 'Closed'].includes(applicationStatus) ? daysAgo(8 + i) : null,
        installedByTechnicianName: hasInstalled ? assignedTech.username : '',
        installationAssignedTechnician: installationAssigned ? assignedTech.username : '',
        installationAssignedTechnicianMobile: installationAssigned ? assignedTech.mobile : '',
        installationAssignedAt: installationAssigned ? daysAgo(Math.max(1, 24 - i)) : null,
        commissioningDate: ['Installation Completed', 'Complaint Raised', 'Closed'].includes(applicationStatus) ? daysAgo(7 + i) : null,
        installedPhotoUpload: hasInstalled?mediaSet.installOverview:'',
        panels: hasInstalled ? [`PNL-${beneficiaryId}-01`, `PNL-${beneficiaryId}-02`, `PNL-${beneficiaryId}-03`] : [],
        pumpNoUnique: hasInstalled ? `PUMP-${beneficiaryId}` : '',
        motorNoUnique: hasInstalled ? `MOTOR-${beneficiaryId}` : '',
        controllerNoUnique: hasInstalled ? `CTRL-${beneficiaryId}` : '',
        imeiNoUnique: hasInstalled ? `IMEI-${beneficiaryId}` : '',
        installationDoneYesNo: hasInstalled ? 'Yes' : installationAssigned ? 'No' : '',
        pumpNotOperatingYesNo: isComplaintDemo ? 'Yes' : hasInstalled ? 'No' : '',
        companyAssignedPersonName: company.contact?.name,
        complaintIssue: isComplaintDemo ? issue : '',
        complaintRaisedDate: isComplaintDemo ? daysAgo(2) : null,
        complaintNumber: isComplaintDemo ? 'CMP-2026-005' : '',
        complaintRaisedByName: isComplaintDemo ? beneficiaryName : '',
        complaintRaisedById: isComplaintDemo ? beneficiaryId : '',
        complaintStatus: isComplaintDemo ? 'Open' : applicationStatus === 'Closed' ? 'Resolved' : '',
        farmerPhotoUrl: mediaSet.beneficiary || '',
        sitePhotosUrls: hasSurveyStarted ? [mediaSet.site,mediaSet.water].filter(Boolean) : [],
        signatureUrl: hasSurvey ? mediaSet.signature : '',
        finalfarmerPhotoUrl: hasInstalled?mediaSet.finalBeneficiary:'',
        finalsitePhotosUrls: hasInstalled ? [mediaSet.before,mediaSet.during,mediaSet.after,mediaSet.serialPlate].filter(Boolean) : [],
        finalsignatureUrl: hasInstalled?mediaSet.finalSignature:'',
        finalsurveyorsignatureUrl: hasInstalled?mediaSet.surveyorSignature:'',
        excelFileName: `${district.toLowerCase()}-demo-import.xlsx`,
        excelUploadDate: daysAgo(58 - i),
        orderReceivedByTechnician: hasOrder ? assignedTech.username : '',
        orderReceivedConfirmationYesNo: hasOrder ? 'Yes' : '',
        orderReceivedDate: hasOrder ? daysAgo(Math.max(1, 18 - i)) : null,
        orderReceivedRemarks: hasOrder ? 'Demo seeded order acknowledgement' : '',
        orderReceivedYesNo: hasOrder ? 'Yes' : '',
        materialReceivedDate: hasMaterial ? daysAgo(Math.max(1, 14 - i)) : null,
        remarks: issue||'Demo beneficiary record seeded for workflow presentation.',
        confirmedBy: fieldTeam.admin,
        confirmationDate: daysAgo(Math.max(1, 12 - i)),
        lrPhotoUrls: hasMaterial ? [mediaSet.lr].filter(Boolean) : [],
        customFields: {
          demoLifecycleStatus: lifecycleEdge || 'ACTIVE',
          demoStageGroup: stageGroup,
          demoMediaPublicIds: publicIdMap(DEMO_MEDIA, beneficiaryId),
          holdOrRejectReason: lifecycleEdge ? issue : '',
          idProofUrl: mediaSet.idProof,
          consentDocumentUrl: hasSurvey ? mediaSet.consent : '',
          waterSourcePhotoUrl: hasSurveyStarted ? mediaSet.water : '',
          installationBeforeUrl: installationEvidenceAllowed ? mediaSet.before : '',
          installationDuringUrl: installationEvidenceAllowed ? mediaSet.during : '',
          serialPlateUrl: installationEvidenceAllowed ? mediaSet.serialPlate : '',
          completionCertificateUrl: hasInstalled ? mediaSet.completion : '',
          serviceEvidenceUrl: isComplaintDemo ? mediaSet.service : '',
          fullyClearedDemo: ['OPS-DM-019','OPS-HR-028','OPS-HR-029'].includes(beneficiaryId),
          closureSummary: ['OPS-DM-019','OPS-HR-028','OPS-HR-029'].includes(beneficiaryId) ? 'Survey, documents, material custody, installation, commissioning and closure completed for demo.' : ''
        },
      });
      farmers.push({ farmer, wp, agency, company, program, workOrder, importBatch: wp.code === 'WP-NAG-001' ? importBatches[0] : wp.code === 'WP-NAS-001' ? importBatches[1] : wp.code === 'WP-HR-001' ? importBatches[2] : importBatches[3] });
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
      { companyId: companyOne._id, sku: 'PUMP-5HP', name: 'Solar Pump 5HP', category: 'Pump', brand: 'HelioFlow', manufacturer: 'HelioFlow', model: 'HF-5', uom:'EA', serialTracked: true, batchTracked:true, minStock: 5, reorderLevel: 10, warrantyMonths: 24, installationRole: 'PUMP', metadata:{supplier:'HelioFlow Manufacturing',unitRate:118000,currency:'INR',batch:'HF-NAG-2608'} },
      { companyId: companyOne._id, sku: 'MOTOR-5HP', name: 'Submersible Motor 5HP', category: 'Motor', brand: 'HelioFlow', manufacturer: 'HelioFlow', model: 'HM-5', uom:'EA', serialTracked: true, batchTracked:true, minStock: 5, reorderLevel: 10, warrantyMonths: 24, installationRole: 'MOTOR', metadata:{supplier:'HelioFlow Manufacturing',unitRate:82000,currency:'INR',batch:'HM-NAG-2608'} },
      { companyId: companyOne._id, sku: 'CTRL-SMART', name: 'Smart Controller', category: 'Controller', brand: 'SunMesh', manufacturer: 'SunMesh', model: 'SM-CTRL', uom:'EA', serialTracked: true, batchTracked:true, minStock: 5, reorderLevel: 10, warrantyMonths: 24, installationRole: 'CONTROLLER', metadata:{supplier:'SunMesh Controls',unitRate:46000,currency:'INR',batch:'SM-NAG-2608'} },
      { companyId: companyOne._id, sku: 'PNL-550', name: 'Solar Panel 550W', category: 'Panel', brand: 'PhotonOne', manufacturer: 'PhotonOne', model: 'P550', uom:'EA', serialTracked: true, batchTracked:true, minStock: 20, reorderLevel: 50, warrantyMonths: 120, installationRole: 'PANEL', metadata:{supplier:'PhotonOne Solar',unitRate:13800,currency:'INR',batch:'P550-NAG-2608'} },
      { companyId: companyTwo._id, sku: 'PUMP-7HP', name: 'Solar Pump 7.5HP', category: 'Pump', brand: 'AquaVolt', manufacturer: 'AquaVolt', model: 'AV-75', uom:'EA', serialTracked: true, batchTracked:true, minStock: 4, reorderLevel: 8, warrantyMonths: 24, installationRole: 'PUMP', metadata:{supplier:'AquaVolt Systems',unitRate:126000,currency:'INR',batch:'AV75-PUN-2609'} },
      { companyId: companyTwo._id, sku: 'CTRL-FIELD', name: 'Field Controller', category: 'Controller', brand: 'AquaVolt', manufacturer: 'AquaVolt', model: 'FC-200', uom:'EA', serialTracked: true, batchTracked:true, minStock: 4, reorderLevel: 8, warrantyMonths: 24, installationRole: 'CONTROLLER', metadata:{supplier:'AquaVolt Systems',unitRate:51000,currency:'INR',batch:'FC200-PUN-2609'} },
      { companyId: companyTwo._id, sku: 'PNL-540', name: 'Solar Panel 540W', category: 'Panel', brand: 'PhotonOne', manufacturer: 'PhotonOne', model: 'P540', uom:'EA', serialTracked: true, batchTracked:true, minStock: 20, reorderLevel: 40, warrantyMonths: 120, installationRole: 'PANEL', metadata:{supplier:'PhotonOne Solar',unitRate:13200,currency:'INR',batch:'P540-PUN-2609'} },
    ]);

    const itemMap = Object.fromEntries(items.map((item) => [item.sku, item]));

    const warehouses = await Warehouse.insertMany([
      { companyId: companyOne._id, code: 'WH-NAG-CEN', name: 'Nagpur Central Warehouse', type: 'CENTRAL', address: { line1: 'Warehouse Road', city: 'Nagpur', district: 'Nagpur', state: 'Maharashtra', country: 'India', pincode: '440016' }, location: { latitude: 21.122, longitude: 79.059 } },
      { companyId: companyOne._id, code: 'WH-NAG-AGY', name: 'Nagpur Agency Stock', type: 'AGENCY', organizationId: nagpurAgency._id, address: { line1: 'Hingna Depot', city: 'Nagpur', district: 'Nagpur', state: 'Maharashtra', country: 'India', pincode: '440016' }, location: { latitude: 21.105, longitude: 79.031 } },
      { companyId: companyOne._id, code: 'WH-NAS-AGY', name: 'Nashik Agency Stock', type: 'AGENCY', organizationId: nashikAgency._id, address: { line1: 'Sinnar Depot', city: 'Nashik', district: 'Nashik', state: 'Maharashtra', country: 'India', pincode: '422103' }, location: { latitude: 19.84, longitude: 73.99 } },
      { companyId: companyOne._id, code: 'WH-HRY-AGY', name: 'Haryana Agency Stock', type: 'AGENCY', organizationId: haryanaAgency._id, address: { line1: 'Karnal Solar Service Depot', city: 'Karnal', district: 'Karnal', state: 'Haryana', country: 'India', pincode: '132001' }, location: { latitude: 29.6857, longitude: 76.9905 } },
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
          batchNo: item.metadata?.batch || `${prefix}-BATCH`,
          status,
          warehouseId,
          agencyId,
          metadata: { seeded: true },
        });
      }
    };
    addSerials(companyOne._id, itemMap['PUMP-5HP'], 9, 'P5-NAG', warehouseMap['WH-NAG-CEN']._id, 'AVAILABLE');
    addSerials(companyOne._id, itemMap['MOTOR-5HP'], 9, 'M5-NAG', warehouseMap['WH-NAG-CEN']._id, 'AVAILABLE');
    addSerials(companyOne._id, itemMap['CTRL-SMART'], 10, 'C1-NAG', warehouseMap['WH-NAG-CEN']._id, 'AVAILABLE');
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
          { itemId: itemMap['PUMP-5HP']._id, description: 'Solar Pump 5HP', orderedQty: 9, receivedQty: 9, unitPrice: 118000, taxPercent: 18 },
          { itemId: itemMap['MOTOR-5HP']._id, description: 'Submersible Motor 5HP', orderedQty: 9, receivedQty: 9, unitPrice: 82000, taxPercent: 18 },
          { itemId: itemMap['CTRL-SMART']._id, description: 'Smart Controller', orderedQty: 10, receivedQty: 10, unitPrice: 46000, taxPercent: 18 },
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
        status: 'RECEIVED',
        lines: [
          { itemId: itemMap['PUMP-7HP']._id, description: 'Solar Pump 7.5HP', orderedQty: 5, receivedQty: 5, unitPrice: 126000, taxPercent: 18 },
          { itemId: itemMap['CTRL-FIELD']._id, description: 'Field Controller', orderedQty: 5, receivedQty: 5, unitPrice: 51000, taxPercent: 18 },
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
          { itemId: itemMap['PUMP-5HP']._id, quantity: 9, acceptedQty: 9, rejectedQty: 0, serialIds: serials.filter((s) => s.serialNumber.startsWith('P5-NAG')).map((s) => s._id) },
          { itemId: itemMap['MOTOR-5HP']._id, quantity: 9, acceptedQty: 9, rejectedQty: 0, serialIds: serials.filter((s) => s.serialNumber.startsWith('M5-NAG')).map((s) => s._id) },
          { itemId: itemMap['CTRL-SMART']._id, quantity: 10, acceptedQty: 10, rejectedQty: 0, serialIds: serials.filter((s) => s.serialNumber.startsWith('C1-NAG')).map((s) => s._id) },
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
          { itemId: itemMap['PUMP-7HP']._id, quantity: 5, acceptedQty: 5, rejectedQty: 0, serialIds: serials.filter((s) => s.serialNumber.startsWith('P7-PUN')).map((s) => s._id) },
          { itemId: itemMap['CTRL-FIELD']._id, quantity: 5, acceptedQty: 5, rejectedQty: 0, serialIds: serials.filter((s) => s.serialNumber.startsWith('CF-PUN')).map((s) => s._id) },
          { itemId: itemMap['PNL-540']._id, quantity: 12, acceptedQty: 12, rejectedQty: 0, serialIds: serials.filter((s) => s.serialNumber.startsWith('PNL-PUN')).map((s) => s._id) },
        ],
        receivedBy: companyUsers.c2_inventory._id,
      },
    ]);

    await InventoryBalance.insertMany([
      { companyId: companyOne._id, warehouseId: warehouseMap['WH-NAG-CEN']._id, itemId: itemMap['PUMP-5HP']._id, onHand: 0, allocated: 0, inTransit: 1, damaged: 0, lastMovementAt: daysAgo(1) },
      { companyId: companyOne._id, warehouseId: warehouseMap['WH-NAG-CEN']._id, itemId: itemMap['MOTOR-5HP']._id, onHand: 0, allocated: 0, inTransit: 1, damaged: 0, lastMovementAt: daysAgo(1) },
      { companyId: companyOne._id, warehouseId: warehouseMap['WH-NAG-CEN']._id, itemId: itemMap['CTRL-SMART']._id, onHand: 1, allocated: 0, inTransit: 1, damaged: 0, lastMovementAt: daysAgo(1) },
      { companyId: companyOne._id, warehouseId: warehouseMap['WH-NAG-CEN']._id, itemId: itemMap['PNL-550']._id, onHand: 7, allocated: 0, inTransit: 3, damaged: 0, lastMovementAt: daysAgo(1) },
      { companyId: companyOne._id, warehouseId: warehouseMap['WH-NAG-AGY']._id, itemId: itemMap['PNL-550']._id, onHand: 2, allocated: 0, inTransit: 0, damaged: 0, lastMovementAt: daysAgo(2) },
      { companyId: companyTwo._id, warehouseId: warehouseMap['WH-PUN-CEN']._id, itemId: itemMap['PUMP-7HP']._id, onHand: 4, allocated: 0, inTransit: 0, damaged: 0, lastMovementAt: daysAgo(1) },
      { companyId: companyTwo._id, warehouseId: warehouseMap['WH-PUN-CEN']._id, itemId: itemMap['CTRL-FIELD']._id, onHand: 4, allocated: 0, inTransit: 0, damaged: 0, lastMovementAt: daysAgo(1) },
      { companyId: companyTwo._id, warehouseId: warehouseMap['WH-PUN-CEN']._id, itemId: itemMap['PNL-540']._id, onHand: 9, allocated: 0, inTransit: 0, damaged: 0, lastMovementAt: daysAgo(1) },
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
      proofOfDelivery: { receiverName: 'Prashant Wankhede', receivedAt: daysAgo(16), notes: 'Received in good condition', photoUrls: [] },
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
      proofOfDelivery: { receiverName: 'Nilesh Patne', receivedAt: daysAgo(12), notes: 'Agency receipt confirmed', photoUrls: [] },
    });

    const setSerialState = async (serialNumbers, { status, warehouseId = null, agencyId = null, farmerId = null }) => {
      for (const serialNumber of serialNumbers) {
        const serial = serialMap[serialNumber];
        if (!serial) continue;
        serial.status = status;
        serial.warehouseId = warehouseId;
        serial.agencyId = agencyId;
        serial.farmerId = farmerId;
        await serial.save();
      }
    };
    await setSerialState(nagpurDeliveredSerials, { status: 'AGENCY_STOCK', warehouseId: warehouseMap['WH-NAG-AGY']._id, agencyId: nagpurAgency._id });
    await setSerialState(nashikTransitSerials, { status: 'IN_TRANSIT', agencyId: nashikAgency._id });
    await setSerialState(puneDeliveredSerials, { status: 'AGENCY_STOCK', warehouseId: warehouseMap['WH-PUN-AGY']._id, agencyId: puneAgency._id });

    await TrackingEvent.insertMany([
      { companyId: companyOne._id, shipmentId: shipmentTwo._id, driverId: driverOne._id, latitude: 20.33, longitude: 74.12, accuracy: 20, speed: 42, heading: 90, source: 'DRIVER_LINK', capturedAt: daysAgo(2), metadata: { checkpoint: 'Malegaon bypass' } },
      { companyId: companyOne._id, shipmentId: shipmentTwo._id, driverId: driverOne._id, latitude: 20.02, longitude: 73.79, accuracy: 18, speed: 28, heading: 115, source: 'DRIVER_LINK', capturedAt: daysAgo(1), metadata: { checkpoint: 'Nashik approach' } },
      { companyId: companyTwo._id, shipmentId: shipmentThree._id, driverId: driverTwo._id, latitude: 18.15, longitude: 74.57, accuracy: 12, speed: 0, heading: 0, source: 'DRIVER_LINK', capturedAt: daysAgo(12), metadata: { checkpoint: 'Baramati depot delivered' } },
    ]);

    const installedFarmerIds = ['OPS-DM-004', 'OPS-DM-005', 'OPS-DM-006'];
    const farmerLookup = Object.fromEntries(farmers.map((entry) => [entry.farmer.beneficiaryId, entry]));
    const installedAssets = [];

    await setSerialState(puneDeliveredSerials, { status: 'ISSUED', agencyId: puneAgency._id, farmerId: farmerLookup['OPS-DM-011'].farmer._id });

    const installAssetFor = async ({ beneficiaryId, serialPrefixList, technicianKey }) => {
      const farmerEntry = farmerLookup[beneficiaryId];
      const tech = agencyUsers[technicianKey];
      const companyId = farmerEntry.company._id;
      const agencyId = farmerEntry.agency._id;
      const installedSerials={pump:'',motor:'',controller:'',panels:[]};
      for (const serialNumber of serialPrefixList) {
        const serial = serialMap[serialNumber];
        let assetRole = 'OTHER';
        if (serialNumber.startsWith('P5') || serialNumber.startsWith('P7')) assetRole = 'PUMP';
        if (serialNumber.startsWith('M5')) assetRole = 'MOTOR';
        if (serialNumber.startsWith('C1') || serialNumber.startsWith('CF')) assetRole = 'CONTROLLER';
        if (serialNumber.startsWith('PNL')) assetRole = 'PANEL';
        if (assetRole==='PUMP') installedSerials.pump=serialNumber;
        if (assetRole==='MOTOR') installedSerials.motor=serialNumber;
        if (assetRole==='CONTROLLER') installedSerials.controller=serialNumber;
        if (assetRole==='PANEL') installedSerials.panels.push(serialNumber);
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
      await Farmer.updateOne({_id:farmerEntry.farmer._id},{$set:{
        pumpNoUnique:installedSerials.pump,motorNoUnique:installedSerials.motor,controllerNoUnique:installedSerials.controller,
        imeiNoUnique:installedSerials.controller?`IMEI-${installedSerials.controller}`:'',panels:installedSerials.panels,
        installedByTechnicianName:tech.username,installationAssignedTechnician:tech.username,installationAssignedTechnicianMobile:tech.mobile
      }});
    };

    await installAssetFor({ beneficiaryId: 'OPS-DM-004', serialPrefixList: ['P5-NAG-001', 'M5-NAG-001', 'C1-NAG-001', 'PNL-NAG-001'], technicianKey: 'nagpur_tech_1' });
    await installAssetFor({ beneficiaryId: 'OPS-DM-005', serialPrefixList: ['P5-NAG-002', 'M5-NAG-002', 'C1-NAG-002', 'PNL-NAG-004'], technicianKey: 'nagpur_tech_2' });
    await installAssetFor({ beneficiaryId: 'OPS-DM-006', serialPrefixList: ['P5-NAG-004', 'M5-NAG-004', 'C1-NAG-004', 'PNL-NAG-008'], technicianKey: 'nashik_tech_1' });
    await installAssetFor({ beneficiaryId: 'OPS-DM-015', serialPrefixList: ['P5-NAG-006', 'M5-NAG-006', 'C1-NAG-006', 'PNL-NAG-009'], technicianKey: 'nagpur_tech_1' });
    await installAssetFor({ beneficiaryId: 'OPS-DM-016', serialPrefixList: ['P5-NAG-007', 'M5-NAG-007', 'C1-NAG-007', 'PNL-NAG-010'], technicianKey: 'nagpur_tech_2' });
    await installAssetFor({ beneficiaryId: 'OPS-DM-019', serialPrefixList: ['P5-NAG-008', 'M5-NAG-008', 'C1-NAG-008', 'PNL-NAG-011'], technicianKey: 'nagpur_tech_1' });
    await installAssetFor({ beneficiaryId: 'OPS-HR-028', serialPrefixList: ['P5-NAG-009', 'M5-NAG-009', 'C1-NAG-009', 'PNL-NAG-013'], technicianKey: 'haryana_tech_1' });
    await installAssetFor({ beneficiaryId: 'OPS-HR-029', serialPrefixList: ['P5-NAG-005', 'M5-NAG-005', 'C1-NAG-005', 'PNL-NAG-012'], technicianKey: 'haryana_tech_2' });

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
        { itemId: itemMap['PNL-550']._id, quantity: 1, serialIds: [serialMap['PNL-NAG-001']._id] },
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
        { itemId: itemMap['CTRL-SMART']._id, quantity: 1, serialIds: [serialMap['C1-NAG-002']._id] },
        { itemId: itemMap['PNL-550']._id, quantity: 1, serialIds: [serialMap['PNL-NAG-004']._id] },
      ],
      status: 'CONSUMED',
      issuedAt: daysAgo(9),
      issuedBy: companyUsers.c1_inventory._id,
      notes: 'Issued, later complaint opened for demo case.',
    });

    const issueThree = await MaterialIssue.create({
      companyId: companyOne._id, agencyId: nashikAgency._id, warehouseId: warehouseMap['WH-NAS-AGY']._id,
      technicianUserId: agencyUsers.nashik_tech_1._id, workPackageId: wpNashik._id, farmerId: farmerLookup['OPS-DM-006'].farmer._id,
      issueNo: 'MI-NAS-001', items: [
        { itemId: itemMap['PUMP-5HP']._id, quantity: 1, serialIds: [serialMap['P5-NAG-004']._id] },
        { itemId: itemMap['MOTOR-5HP']._id, quantity: 1, serialIds: [serialMap['M5-NAG-004']._id] },
        { itemId: itemMap['CTRL-SMART']._id, quantity: 1, serialIds: [serialMap['C1-NAG-004']._id] },
        { itemId: itemMap['PNL-550']._id, quantity: 1, serialIds: [serialMap['PNL-NAG-008']._id] }
      ], status: 'CONSUMED', issuedAt: daysAgo(12), issuedBy: companyUsers.c1_inventory._id, notes: 'Nashik completed installation material custody.'
    });
    const issueFour = await MaterialIssue.create({
      companyId: companyOne._id, agencyId: nagpurAgency._id, warehouseId: warehouseMap['WH-NAG-CEN']._id,
      technicianUserId: agencyUsers.nagpur_tech_1._id, workPackageId: wpNagpur._id, farmerId: farmerLookup['OPS-DM-015'].farmer._id,
      issueNo: 'MI-NAG-003', items: [
        { itemId: itemMap['PUMP-5HP']._id, quantity: 1, serialIds: [serialMap['P5-NAG-006']._id] },
        { itemId: itemMap['MOTOR-5HP']._id, quantity: 1, serialIds: [serialMap['M5-NAG-006']._id] },
        { itemId: itemMap['CTRL-SMART']._id, quantity: 1, serialIds: [serialMap['C1-NAG-006']._id] },
        { itemId: itemMap['PNL-550']._id, quantity: 1, serialIds: [serialMap['PNL-NAG-009']._id] }
      ], status: 'CONSUMED', issuedAt: daysAgo(11), issuedBy: companyUsers.c1_inventory._id, notes: 'Completed installation material custody.'
    });
    const issueFive = await MaterialIssue.create({
      companyId: companyOne._id, agencyId: nagpurAgency._id, warehouseId: warehouseMap['WH-NAG-CEN']._id,
      technicianUserId: agencyUsers.nagpur_tech_2._id, workPackageId: wpNagpur._id, farmerId: farmerLookup['OPS-DM-016'].farmer._id,
      issueNo: 'MI-NAG-004', items: [
        { itemId: itemMap['PUMP-5HP']._id, quantity: 1, serialIds: [serialMap['P5-NAG-007']._id] },
        { itemId: itemMap['MOTOR-5HP']._id, quantity: 1, serialIds: [serialMap['M5-NAG-007']._id] },
        { itemId: itemMap['CTRL-SMART']._id, quantity: 1, serialIds: [serialMap['C1-NAG-007']._id] },
        { itemId: itemMap['PNL-550']._id, quantity: 1, serialIds: [serialMap['PNL-NAG-010']._id] }
      ], status: 'CONSUMED', issuedAt: daysAgo(10), issuedBy: companyUsers.c1_inventory._id, notes: 'Closed installation material custody.'
    });
    const issueSix = await MaterialIssue.create({
      companyId: companyOne._id, agencyId: nagpurAgency._id, warehouseId: warehouseMap['WH-NAG-CEN']._id,
      technicianUserId: agencyUsers.nagpur_tech_1._id, workPackageId: wpNagpur._id, farmerId: farmerLookup['OPS-DM-019'].farmer._id,
      issueNo: 'MI-NAG-005', items: [
        { itemId: itemMap['PUMP-5HP']._id, quantity: 1, serialIds: [serialMap['P5-NAG-008']._id] },
        { itemId: itemMap['MOTOR-5HP']._id, quantity: 1, serialIds: [serialMap['M5-NAG-008']._id] },
        { itemId: itemMap['CTRL-SMART']._id, quantity: 1, serialIds: [serialMap['C1-NAG-008']._id] },
        { itemId: itemMap['PNL-550']._id, quantity: 1, serialIds: [serialMap['PNL-NAG-011']._id] }
      ], status: 'CONSUMED', issuedAt: daysAgo(9), issuedBy: companyUsers.c1_inventory._id,
      notes: 'Fully cleared demo installation material custody for OPS-DM-019.'
    });

    const haryanaIssueTwo = await MaterialIssue.create({
      companyId: companyOne._id, agencyId: haryanaAgency._id, warehouseId: warehouseMap['WH-HRY-AGY']._id,
      technicianUserId: agencyUsers.haryana_tech_1._id, workPackageId: wpHaryana._id, farmerId: farmerLookup['OPS-HR-028'].farmer._id,
      issueNo: 'MI-HR-002', items: [
        { itemId: itemMap['PUMP-5HP']._id, quantity: 1, serialIds: [serialMap['P5-NAG-009']._id] },
        { itemId: itemMap['MOTOR-5HP']._id, quantity: 1, serialIds: [serialMap['M5-NAG-009']._id] },
        { itemId: itemMap['CTRL-SMART']._id, quantity: 1, serialIds: [serialMap['C1-NAG-009']._id] },
        { itemId: itemMap['PNL-550']._id, quantity: 1, serialIds: [serialMap['PNL-NAG-013']._id] }
      ], status: 'CONSUMED', issuedAt: daysAgo(7), issuedBy: companyUsers.c1_inventory._id, notes: 'Haryana fully completed demo installation material custody.'
    });

    const haryanaIssue = await MaterialIssue.create({
      companyId: companyOne._id, agencyId: haryanaAgency._id, warehouseId: warehouseMap['WH-HRY-AGY']._id,
      technicianUserId: agencyUsers.haryana_tech_2._id, workPackageId: wpHaryana._id, farmerId: farmerLookup['OPS-HR-029'].farmer._id,
      issueNo: 'MI-HR-001', items: [
        { itemId: itemMap['PUMP-5HP']._id, quantity: 1, serialIds: [serialMap['P5-NAG-005']._id] },
        { itemId: itemMap['MOTOR-5HP']._id, quantity: 1, serialIds: [serialMap['M5-NAG-005']._id] },
        { itemId: itemMap['CTRL-SMART']._id, quantity: 1, serialIds: [serialMap['C1-NAG-005']._id] },
        { itemId: itemMap['PNL-550']._id, quantity: 1, serialIds: [serialMap['PNL-NAG-012']._id] }
      ], status: 'CONSUMED', issuedAt: daysAgo(6), issuedBy: companyUsers.c1_inventory._id, notes: 'Haryana completed demo installation material custody.'
    });

    const puneIssue = await MaterialIssue.create({
      companyId: companyTwo._id, agencyId: puneAgency._id, warehouseId: warehouseMap['WH-PUN-AGY']._id,
      technicianUserId: agencyUsers.pune_tech_1._id, workPackageId: wpPune._id, farmerId: farmerLookup['OPS-DM-011'].farmer._id,
      issueNo: 'MI-PUN-001', items: [
        { itemId: itemMap['PUMP-7HP']._id, quantity: 1, serialIds: [serialMap['P7-PUN-001']._id] },
        { itemId: itemMap['CTRL-FIELD']._id, quantity: 1, serialIds: [serialMap['CF-PUN-001']._id] },
        { itemId: itemMap['PNL-540']._id, quantity: 3, serialIds: ['PNL-PUN-001','PNL-PUN-002','PNL-PUN-003'].map(n=>serialMap[n]._id) }
      ], status: 'ISSUED', issuedAt: daysAgo(3), issuedBy: companyUsers.c2_inventory._id, notes: 'Material assigned for upcoming Pune installation.'
    });

    const stockMovements = [
      { companyId: companyOne._id, itemId: itemMap['PUMP-5HP']._id, serialIds: serials.filter(x=>x.serialNumber.startsWith('P5-NAG')).map(x=>x._id), quantity: 9, movementType: 'RECEIPT', toWarehouseId: warehouseMap['WH-NAG-CEN']._id, referenceType: 'GoodsReceipt', performedBy: companyUsers.c1_inventory._id, reason: 'Demo GRN receipt', occurredAt: daysAgo(44) },
      { companyId: companyOne._id, itemId: itemMap['MOTOR-5HP']._id, serialIds: serials.filter(x=>x.serialNumber.startsWith('M5-NAG')).map(x=>x._id), quantity: 9, movementType: 'RECEIPT', toWarehouseId: warehouseMap['WH-NAG-CEN']._id, referenceType: 'GoodsReceipt', performedBy: companyUsers.c1_inventory._id, reason: 'Demo GRN receipt', occurredAt: daysAgo(44) },
      { companyId: companyOne._id, itemId: itemMap['CTRL-SMART']._id, serialIds: serials.filter(x=>x.serialNumber.startsWith('C1-NAG')).map(x=>x._id), quantity: 10, movementType: 'RECEIPT', toWarehouseId: warehouseMap['WH-NAG-CEN']._id, referenceType: 'GoodsReceipt', performedBy: companyUsers.c1_inventory._id, reason: 'Demo GRN receipt', occurredAt: daysAgo(44) },
      { companyId: companyOne._id, itemId: itemMap['PNL-550']._id, serialIds: serials.filter(x=>x.serialNumber.startsWith('PNL-NAG')).map(x=>x._id), quantity: 20, movementType: 'RECEIPT', toWarehouseId: warehouseMap['WH-NAG-CEN']._id, referenceType: 'GoodsReceipt', performedBy: companyUsers.c1_inventory._id, reason: 'Demo GRN receipt', occurredAt: daysAgo(44) },
      { companyId: companyTwo._id, itemId: itemMap['PUMP-7HP']._id, serialIds: serials.filter(x=>x.serialNumber.startsWith('P7-PUN')).map(x=>x._id), quantity: 5, movementType: 'RECEIPT', toWarehouseId: warehouseMap['WH-PUN-CEN']._id, referenceType: 'GoodsReceipt', performedBy: companyUsers.c2_inventory._id, reason: 'Demo GRN receipt', occurredAt: daysAgo(21) },
      { companyId: companyTwo._id, itemId: itemMap['CTRL-FIELD']._id, serialIds: serials.filter(x=>x.serialNumber.startsWith('CF-PUN')).map(x=>x._id), quantity: 5, movementType: 'RECEIPT', toWarehouseId: warehouseMap['WH-PUN-CEN']._id, referenceType: 'GoodsReceipt', performedBy: companyUsers.c2_inventory._id, reason: 'Demo GRN receipt', occurredAt: daysAgo(21) },
      { companyId: companyTwo._id, itemId: itemMap['PNL-540']._id, serialIds: serials.filter(x=>x.serialNumber.startsWith('PNL-PUN')).map(x=>x._id), quantity: 12, movementType: 'RECEIPT', toWarehouseId: warehouseMap['WH-PUN-CEN']._id, referenceType: 'GoodsReceipt', performedBy: companyUsers.c2_inventory._id, reason: 'Demo GRN receipt', occurredAt: daysAgo(21) },
      ...shipmentOne.items.map(line=>({companyId:companyOne._id,itemId:line.itemId,serialIds:line.serialIds,quantity:line.quantity,movementType:'DISPATCH',fromWarehouseId:warehouseMap['WH-NAG-CEN']._id,toWarehouseId:warehouseMap['WH-NAG-AGY']._id,toOrganizationId:nagpurAgency._id,referenceType:'Shipment',referenceId:shipmentOne._id,performedBy:companyUsers.c1_logistics._id,reason:'Nagpur agency delivery',occurredAt:daysAgo(18)})),
      ...shipmentTwo.items.map(line=>({companyId:companyOne._id,itemId:line.itemId,serialIds:line.serialIds,quantity:line.quantity,movementType:'DISPATCH',fromWarehouseId:warehouseMap['WH-NAG-CEN']._id,toWarehouseId:warehouseMap['WH-NAS-AGY']._id,toOrganizationId:nashikAgency._id,referenceType:'Shipment',referenceId:shipmentTwo._id,performedBy:companyUsers.c1_logistics._id,reason:'Nashik agency dispatch',occurredAt:daysAgo(3)})),
      ...shipmentThree.items.map(line=>({companyId:companyTwo._id,itemId:line.itemId,serialIds:line.serialIds,quantity:line.quantity,movementType:'DISPATCH',fromWarehouseId:warehouseMap['WH-PUN-CEN']._id,toWarehouseId:warehouseMap['WH-PUN-AGY']._id,toOrganizationId:puneAgency._id,referenceType:'Shipment',referenceId:shipmentThree._id,performedBy:companyUsers.c2_inventory._id,reason:'Pune agency delivery',occurredAt:daysAgo(14)})),
      ...[issueOne,issueTwo,issueThree,issueFour,issueFive,issueSix,haryanaIssueTwo,haryanaIssue,puneIssue].flatMap(issue=>issue.items.map(line=>({companyId:issue.companyId,itemId:line.itemId,serialIds:line.serialIds,quantity:line.quantity,movementType:'ISSUE',fromWarehouseId:issue.warehouseId,toOrganizationId:issue.agencyId,referenceType:'MaterialIssue',referenceId:issue._id,performedBy:issue.issuedBy,reason:`Material issue ${issue.issueNo}`,occurredAt:issue.issuedAt}))),
      ...installedAssets.map(asset=>({companyId:asset.companyId,itemId:asset.itemId,serialIds:[asset.inventorySerialId],quantity:1,movementType:'INSTALL',toOrganizationId:asset.agencyId,referenceType:'InstalledAsset',referenceId:asset._id,performedBy:asset.companyId.equals(companyTwo._id)?companyUsers.c2_inventory._id:companyUsers.c1_inventory._id,reason:'Installed at beneficiary site',occurredAt:asset.installedAt}))
    ];
    await StockMovement.insertMany(stockMovements);

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
        evidence: { photoUrls: [demoMedia('OPS-DM-005','service')].filter(Boolean) },
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
        evidence: { photoUrls: [] },
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
        blockedAmount: 0,
        beneficiaryCount: 2,
        readyAt: daysAgo(4),
        submittedAt: daysAgo(3),
        dueAt: daysFromNow(7),
        slaState: 'ON_TRACK',
        notes: 'Submitted client receivable backed by closed Nagpur installations, completion evidence and final inspection records.',
        metadata: { demoStory: 'SUBMITTED_RECEIVABLE', beneficiaryRefs: ['OPS-DM-019','OPS-DM-016'] },
      },
      {
        companyId: companyOne._id,
        programId: programHaryana._id,
        contractId: contractHaryana._id,
        workOrderId: workOrderHaryana._id,
        workPackageId: wpHaryana._id,
        claimNo: 'CLM-SKEPL-002',
        title: 'Haryana Commissioned Sites - Paid Claim',
        status: 'PAID',
        currency: 'INR',
        grossAmount: 720000,
        eligibleAmount: 690000,
        approvedAmount: 680000,
        paidAmount: 680000,
        blockedAmount: 0,
        beneficiaryCount: 2,
        readyAt: daysAgo(18),
        submittedAt: daysAgo(16),
        approvedAt: daysAgo(10),
        paidAt: daysAgo(5),
        dueAt: daysAgo(4),
        slaState: 'NOT_APPLICABLE',
        notes: 'Fully realized Haryana claim for OPS-HR-028 and OPS-HR-029 after verified commissioning and final inspection PASS.',
        metadata: { demoStory: 'PAID_REALIZED', beneficiaryRefs: ['OPS-HR-028','OPS-HR-029'] },
      },
      {
        companyId: companyOne._id,
        programId: programOne._id,
        contractId: contractOne._id,
        workOrderId: workOrderOne._id,
        workPackageId: wpNagpur._id,
        claimNo: 'CLM-SKEPL-003',
        title: 'Nagpur Milestone Claim - Partial Approval',
        status: 'PARTIALLY_APPROVED',
        currency: 'INR',
        grossAmount: 610000,
        eligibleAmount: 580000,
        approvedAmount: 520000,
        paidAmount: 260000,
        blockedAmount: 60000,
        blockedReason: 'Client measurement reconciliation pending for one milestone line.',
        beneficiaryCount: 3,
        readyAt: daysAgo(12),
        submittedAt: daysAgo(10),
        approvedAt: daysAgo(4),
        dueAt: daysFromNow(2),
        slaState: 'DUE_SOON',
        notes: 'Demonstrates approved, paid, receivable and blocked value in the same governed claim.',
        metadata: { demoStory: 'PARTIAL_BLOCKED', beneficiaryRefs: ['OPS-DM-005','OPS-DM-015','OPS-DM-019'] },
      },
      {
        companyId: companyOne._id,
        programId: programHaryana._id,
        contractId: contractHaryana._id,
        workOrderId: workOrderHaryana._id,
        workPackageId: wpHaryana._id,
        claimNo: 'CLM-SKEPL-004',
        title: 'Haryana Next Milestone Claim Packet',
        status: 'READY',
        currency: 'INR',
        grossAmount: 390000,
        eligibleAmount: 360000,
        approvedAmount: 0,
        paidAmount: 0,
        blockedAmount: 0,
        beneficiaryCount: 2,
        readyAt: daysAgo(1),
        dueAt: daysFromNow(5),
        slaState: 'ON_TRACK',
        notes: 'Commercial packet is ready for finance review; submission has not yet been made.',
        metadata: { demoStory: 'READY_TO_SUBMIT', beneficiaryRefs: ['OPS-HR-026','OPS-HR-027'] },
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
        blockedAmount: 0,
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
        farmerId: farmerLookup['OPS-DM-019'].farmer._id,
        recordNo: 'CMPREC-019',
        type: 'FINAL_INSPECTION',
        status: 'PASS',
        items: [
          { key: 'site_clean', label: 'Site condition', status: 'PASS', checkedAt: daysAgo(3) },
          { key: 'asset_serials', label: 'Serial capture', status: 'PASS', checkedAt: daysAgo(3), evidence: [demoMedia('OPS-DM-019','serial-plate')].filter(Boolean) },
          { key: 'commissioning', label: 'Commissioning proof', status: 'PASS', checkedAt: daysAgo(3), evidence: [demoMedia('OPS-DM-019','install-after')].filter(Boolean) },
          { key: 'beneficiary_handover', label: 'Beneficiary handover and acknowledgement', status: 'PASS', checkedAt: daysAgo(3), evidence: [demoMedia('OPS-DM-019','final-beneficiary')].filter(Boolean) },
        ],
        geo: { latitude: 21.1458, longitude: 79.0882, accuracy: 9, capturedAt: daysAgo(3) },
        reviewedBy: companyUsers.c1_quality._id,
        reviewedAt: daysAgo(3),
        notes: 'Fully cleared demo record: survey, material, installation, commissioning, final inspection and handover all passed.',
      },
      {
        companyId: companyOne._id,
        programId: programHaryana._id,
        workPackageId: wpHaryana._id,
        agencyId: haryanaAgency._id,
        farmerId: farmerLookup['OPS-HR-028'].farmer._id,
        recordNo: 'CMPREC-HR-028',
        type: 'FINAL_INSPECTION',
        status: 'PASS',
        items: [
          { key: 'site_clean', label: 'Site condition', status: 'PASS', checkedAt: daysAgo(3) },
          { key: 'asset_serials', label: 'Serial capture', status: 'PASS', checkedAt: daysAgo(3), evidence: [demoMedia('OPS-HR-028','serial-plate')].filter(Boolean) },
          { key: 'commissioning', label: 'Commissioning proof', status: 'PASS', checkedAt: daysAgo(3), evidence: [demoMedia('OPS-HR-028','install-after')].filter(Boolean) },
          { key: 'beneficiary_handover', label: 'Beneficiary handover', status: 'PASS', checkedAt: daysAgo(3), evidence: [demoMedia('OPS-HR-028','final-beneficiary')].filter(Boolean) },
        ],
        geo: { latitude: 28.8955, longitude: 76.6066, accuracy: 10, capturedAt: daysAgo(3) },
        reviewedBy: companyUsers.c1_quality._id,
        reviewedAt: daysAgo(3),
        notes: 'Haryana Rohtak demo site fully inspected, commissioned and closed.',
      },
      {
        companyId: companyOne._id,
        programId: programHaryana._id,
        workPackageId: wpHaryana._id,
        agencyId: haryanaAgency._id,
        farmerId: farmerLookup['OPS-HR-029'].farmer._id,
        recordNo: 'CMPREC-HR-029',
        type: 'FINAL_INSPECTION',
        status: 'PASS',
        items: [
          { key: 'site_clean', label: 'Site condition', status: 'PASS', checkedAt: daysAgo(2) },
          { key: 'asset_serials', label: 'Serial capture', status: 'PASS', checkedAt: daysAgo(2), evidence: [demoMedia('OPS-HR-029','serial-plate')].filter(Boolean) },
          { key: 'commissioning', label: 'Commissioning proof', status: 'PASS', checkedAt: daysAgo(2), evidence: [demoMedia('OPS-HR-029','install-after')].filter(Boolean) },
          { key: 'beneficiary_handover', label: 'Beneficiary handover', status: 'PASS', checkedAt: daysAgo(2), evidence: [demoMedia('OPS-HR-029','final-beneficiary')].filter(Boolean) },
        ],
        geo: { latitude: 29.6857, longitude: 76.9905, accuracy: 10, capturedAt: daysAgo(2) },
        reviewedBy: companyUsers.c1_quality._id,
        reviewedAt: daysAgo(2),
        notes: 'Haryana demo site fully inspected, commissioned and closed.',
      },
      {
        companyId: companyOne._id,
        programId: programOne._id,
        workPackageId: wpNagpur._id,
        agencyId: nagpurAgency._id,
        farmerId: farmerLookup['OPS-DM-016'].farmer._id,
        recordNo: 'CMPREC-001',
        type: 'FINAL_INSPECTION',
        status: 'PASS',
        items: [
          { key: 'site_clean', label: 'Site condition', status: 'PASS', checkedAt: daysAgo(7) },
          { key: 'asset_serials', label: 'Serial capture', status: 'PASS', checkedAt: daysAgo(7) },
          { key: 'commissioning', label: 'Commissioning proof', status: 'PASS', checkedAt: daysAgo(7), evidence: [demoMedia('OPS-DM-016','install-after')].filter(Boolean) },
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
          { key: 'photo_evidence', label: 'Service photo evidence', status: 'PASS', evidence: [demoMedia('OPS-DM-005','service')].filter(Boolean) },
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
      { companyId: companyOne._id, category: 'BENEFICIARY', title: 'Beneficiary consent - Lata Gaikwad', documentNo: 'CONS-OPS-DM-003', entityType: 'Farmer', entityId: farmerLookup['OPS-DM-003'].farmer._id, fileUrl: demoMedia('OPS-DM-003','consent'), publicId: publicIdMap(DEMO_MEDIA,'OPS-DM-003').consent, fileName: 'OPS-DM-003-consent.jpg', mimeType: 'image/jpeg', uploadedBy: companyUsers.c1_ops._id, notes: 'Photorealistic AI-generated DEMO consent-document image linked from the governed media bundle.' },
      { companyId: companyOne._id, category: 'BENEFICIARY', title: 'Beneficiary consent - Madhukar Zade', documentNo: 'CONS-OPS-DM-019', entityType: 'Farmer', entityId: farmerLookup['OPS-DM-019'].farmer._id, fileUrl: demoMedia('OPS-DM-019','consent'), publicId: publicIdMap(DEMO_MEDIA,'OPS-DM-019').consent, fileName: 'OPS-DM-019-consent.jpg', mimeType: 'image/jpeg', uploadedBy: companyUsers.c1_ops._id, notes: 'Verified demo consent evidence for the fully cleared beneficiary record.' },
      { companyId: companyOne._id, category: 'BENEFICIARY', title: 'Identity proof - Madhukar Zade', documentNo: 'ID-OPS-DM-019', entityType: 'Farmer', entityId: farmerLookup['OPS-DM-019'].farmer._id, fileUrl: demoMedia('OPS-DM-019','id-proof'), publicId: publicIdMap(DEMO_MEDIA,'OPS-DM-019')['id-proof'], fileName: 'OPS-DM-019-id-proof.jpg', mimeType: 'image/jpeg', uploadedBy: companyUsers.c1_ops._id, notes: 'Fictional SAMPLE/DEMO identity evidence used only for product demonstration.' },
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
    const reqByKey=Object.fromEntries(evidenceReqs.map(r=>[r.key,r]));
    const evidenceRows=[];
    const addEvidence=(beneficiaryId,key,kind,{status='VERIFIED',techKey='nagpur_tech_1',verified=true}={})=>{
      const fe=farmerLookup[beneficiaryId],req=reqByKey[key];if(!fe||!req)return;
      const [lat,lng]=String(fe.farmer.siteLocation||'').split(',').map(Number);
      const tech=agencyUsers[techKey];
      const capturedAt=daysAgo(status==='SUBMITTED'?1:5);
      const geoTag={latitude:lat,longitude:lng,accuracy:9,capturedAt,source:'DEMO',capturedByUserId:tech._id,capturedByName:tech.username,capturedByRole:'field_technician'};
      const url=demoMedia(beneficiaryId,kind),publicId=publicIdMap(DEMO_MEDIA,beneficiaryId)[kind];
      if(!url||!publicId)return;
      evidenceRows.push({companyId:fe.company._id,farmerId:fe.farmer._id,workPackageId:fe.wp._id,agencyId:fe.agency._id,requirementId:req._id,stage:req.stage,status,submissionSource:'DEMO',captureGeo:geoTag,files:[{url,publicId,name:`${beneficiaryId}-${kind}.jpg`,mimeType:'image/jpeg',geo:geoTag}],submittedByLegacyUser:tech._id,verifiedBy:verified?companyUsers.c1_quality._id:undefined,verifiedAt:verified?daysAgo(2):undefined,notes:`Real demo evidence: ${kind}`});
    };
    // Completed/service record: full configured stage evidence.
    addEvidence('OPS-DM-005','site_photo','survey-site',{techKey:'nagpur_tech_2'});
    addEvidence('OPS-DM-005','farmer_consent','consent',{techKey:'nagpur_tech_2'});
    addEvidence('OPS-DM-005','mounting_structure','install-during',{techKey:'nagpur_tech_2'});
    addEvidence('OPS-DM-005','farmer_with_system','final-beneficiary',{techKey:'nagpur_tech_2'});
    addEvidence('OPS-DM-005','commissioning_proof','install-after',{techKey:'nagpur_tech_2'});
    // Survey-complete/processing examples use only evidence available at their stage.
    addEvidence('OPS-DM-003','site_photo','survey-site',{techKey:'nagpur_tech_1'});
    addEvidence('OPS-DM-003','farmer_consent','consent',{techKey:'nagpur_tech_1'});
    addEvidence('OPS-DM-007','site_photo','survey-site',{techKey:'nashik_tech_1'});
    addEvidence('OPS-DM-007','farmer_consent','consent',{techKey:'nashik_tech_1'});
    addEvidence('OPS-DM-014','mounting_structure','install-during',{status:'SUBMITTED',techKey:'nagpur_tech_2',verified:false});
    // Closed record also carries full configured stage evidence.
    addEvidence('OPS-DM-016','site_photo','survey-site',{techKey:'nagpur_tech_2'});
    addEvidence('OPS-DM-016','farmer_consent','consent',{techKey:'nagpur_tech_2'});
    addEvidence('OPS-DM-016','mounting_structure','install-during',{techKey:'nagpur_tech_2'});
    addEvidence('OPS-DM-016','farmer_with_system','final-beneficiary',{techKey:'nagpur_tech_2'});
    addEvidence('OPS-DM-016','commissioning_proof','install-after',{techKey:'nagpur_tech_2'});
    // Fully cleared end-to-end record: every configured required evidence item is VERIFIED.
    addEvidence('OPS-DM-019','site_photo','survey-site',{techKey:'nagpur_tech_1'});
    addEvidence('OPS-DM-019','farmer_consent','consent',{techKey:'nagpur_tech_1'});
    addEvidence('OPS-DM-019','mounting_structure','install-during',{techKey:'nagpur_tech_1'});
    addEvidence('OPS-DM-019','farmer_with_system','final-beneficiary',{techKey:'nagpur_tech_1'});
    addEvidence('OPS-DM-019','commissioning_proof','install-after',{techKey:'nagpur_tech_1'});
    addEvidence('OPS-HR-024','site_photo','survey-site',{techKey:'haryana_tech_1'});
    addEvidence('OPS-HR-024','farmer_consent','consent',{techKey:'haryana_tech_1'});
    addEvidence('OPS-HR-028','site_photo','survey-site',{techKey:'haryana_tech_1'});
    addEvidence('OPS-HR-028','farmer_consent','consent',{techKey:'haryana_tech_1'});
    addEvidence('OPS-HR-028','mounting_structure','install-during',{techKey:'haryana_tech_1'});
    addEvidence('OPS-HR-028','farmer_with_system','final-beneficiary',{techKey:'haryana_tech_1'});
    addEvidence('OPS-HR-028','commissioning_proof','install-after',{techKey:'haryana_tech_1'});
    addEvidence('OPS-HR-029','site_photo','survey-site',{techKey:'haryana_tech_2'});
    addEvidence('OPS-HR-029','farmer_consent','consent',{techKey:'haryana_tech_2'});
    addEvidence('OPS-HR-029','mounting_structure','install-during',{techKey:'haryana_tech_2'});
    addEvidence('OPS-HR-029','farmer_with_system','final-beneficiary',{techKey:'haryana_tech_2'});
    addEvidence('OPS-HR-029','commissioning_proof','install-after',{techKey:'haryana_tech_2'});
    await EvidenceSubmission.insertMany(evidenceRows);


    const insuredAsset=installedAssets.find(a=>a.farmerId.equals(farmerLookup['OPS-DM-004'].farmer._id));
    const complaintInsuredAsset=installedAssets.find(a=>a.farmerId.equals(farmerLookup['OPS-DM-005'].farmer._id));
    await InsurancePolicy.insertMany([
      {companyId:companyOne._id,farmerId:farmerLookup['OPS-DM-004'].farmer._id,installedAssetId:insuredAsset?._id,policyNumber:'INS-SKEPL-2026-0001',referenceNumber:'REF-INS-001',insurer:'Bharat Rural General Insurance',policyType:'COMPREHENSIVE',coverageAmount:425000,premiumAmount:6200,currency:'INR',startDate:daysAgo(7),endDate:daysFromNow(358),status:'ACTIVE',documentUrl:'',documentFileName:'demo-policy-0001.pdf',notes:'Demo comprehensive asset coverage.',createdBy:companyUsers.c1_finance._id},
      {companyId:companyOne._id,farmerId:farmerLookup['OPS-DM-005'].farmer._id,installedAssetId:complaintInsuredAsset?._id,policyNumber:'INS-SKEPL-2026-0002',referenceNumber:'REF-INS-002',insurer:'Bharat Rural General Insurance',policyType:'PUMP',coverageAmount:185000,premiumAmount:3100,currency:'INR',startDate:daysAgo(8),endDate:daysFromNow(22),status:'EXPIRING',documentUrl:'',documentFileName:'demo-policy-0002.pdf',claimNumber:'IC-2026-0091',claimStatus:'Surveyor assigned',claimOpenedAt:daysAgo(1),notes:'Demo policy nearing expiry with claim context.',createdBy:companyUsers.c1_finance._id}
    ]);

    await PDIRecord.insertMany([
      {companyId:companyOne._id,pdiNumber:'PDI-SKEPL-0001',itemId:itemMap['PUMP-5HP']._id,inventorySerialId:serialMap['P5-NAG-005']._id,supplierName:'HelioFlow Manufacturing',brand:'HelioFlow',model:'HF-5',inspectionDate:daysAgo(20),inspectedBy:companyUsers.c1_quality._id,result:'PASS',checklist:[{key:'identity',label:'Serial/model identity verified',status:'PASS'},{key:'physical',label:'Physical condition inspected',status:'PASS'},{key:'electrical',label:'Electrical/functional checks completed',status:'PASS'},{key:'label',label:'Manufacturer label and barcode readable',status:'PASS'}],evidenceUrls:[],certificateUrl:'',disposition:'WAREHOUSE_ACCEPT',warehouseId:warehouseMap['WH-NAG-CEN']._id,notes:'Demo PDI passed and released to stock.'},
      {companyId:companyOne._id,pdiNumber:'PDI-SKEPL-0002',itemId:itemMap['CTRL-SMART']._id,inventorySerialId:serialMap['C1-NAG-010']._id,supplierName:'SunMesh Controls',brand:'SunMesh',model:'SM-CTRL',inspectionDate:daysAgo(18),inspectedBy:companyUsers.c1_quality._id,result:'HOLD',checklist:[{key:'identity',label:'Serial/model identity verified',status:'PASS'},{key:'physical',label:'Physical condition inspected',status:'PASS'},{key:'electrical',label:'Electrical/functional checks completed',status:'PENDING',notes:'Firmware validation pending'},{key:'label',label:'Manufacturer label and barcode readable',status:'PASS'}],evidenceUrls:[],disposition:'HOLD_FOR_REWORK',warehouseId:warehouseMap['WH-NAG-CEN']._id,notes:'Held for firmware validation.'}
    ]);

    const beneficiaryAuditRows=[];
    for(const fe of farmers){
      const f=fe.farmer;const stage=f.customFields?.demoStageGroup||'PROCESSING';const actor=fe.company._id.equals(companyTwo._id)?companyUsers.c2_ops:companyUsers.c1_ops;
      const base={companyId:fe.company._id,organizationId:fe.company._id,actorId:actor._id,actorType:'PlatformUser',entityType:'Farmer',entityId:f._id};
      beneficiaryAuditRows.push({...base,action:'BENEFICIARY_REGISTERED',after:{beneficiaryId:f.beneficiaryId,status:f.applicationStatus,stage},reason:'Deterministic SRIF demo seed',createdAt:daysAgo(60),updatedAt:daysAgo(60)});
      if(f.inspectionStatus!=='Pending')beneficiaryAuditRows.push({...base,action:'SURVEY_STATUS_UPDATED',after:{inspectionStatus:f.inspectionStatus,surveyDate:f.surveyDate,technician:f.surveyorName},reason:'Survey lifecycle seeded consistently',createdAt:f.surveyDate||daysAgo(40),updatedAt:f.surveyDate||daysAgo(40)});
      if(['PROCESSING','COMPLETED'].includes(stage))beneficiaryAuditRows.push({...base,action:'MATERIAL_STAGE_UPDATED',after:{applicationStatus:f.applicationStatus,materialReceived:f.materialReceivedConfirmationYesNo,assignedTechnician:f.installationAssignedTechnician},reason:'Material/installation pipeline seeded consistently',createdAt:f.materialDispatchDate||daysAgo(20),updatedAt:f.materialDispatchDate||daysAgo(20)});
      if(stage==='COMPLETED')beneficiaryAuditRows.push({...base,action:'INSTALLATION_COMPLETED',after:{applicationStatus:f.applicationStatus,installationCompletionDate:f.installationCompletionDate,commissioningDate:f.commissioningDate},reason:'Installed and commissioned demo record',createdAt:f.installationCompletionDate||daysAgo(10),updatedAt:f.installationCompletionDate||daysAgo(10)});
      if(stage==='ON_HOLD'||stage==='REJECTED')beneficiaryAuditRows.push({...base,action:stage==='ON_HOLD'?'BENEFICIARY_ON_HOLD':'BENEFICIARY_REJECTED',after:{stage,reason:f.customFields?.holdOrRejectReason},reason:f.customFields?.holdOrRejectReason||stage,createdAt:daysAgo(3),updatedAt:daysAgo(3)});
    }
    await AuditLog.insertMany([
      ...beneficiaryAuditRows,
      { companyId: companyOne._id, organizationId: companyOne._id, actorId: companyUsers.c1_admin._id, actorType: 'PlatformUser', action: 'DEMO_SEED_COMPLETED', entityType: 'Organization', entityId: companyOne._id, after: { farmers: 16, workPackages: 2, shipments: 2, evidenceSubmissions: evidenceRows.length } },
      { companyId: companyTwo._id, organizationId: companyTwo._id, actorId: companyUsers.c2_admin._id, actorType: 'PlatformUser', action: 'DEMO_SEED_COMPLETED', entityType: 'Organization', entityId: companyTwo._id, after: { farmers: 3, workPackages: 1, shipments: 1, evidenceSubmissions: 0 } },
    ]);

    console.log('✓ Opsynq demo data seeded successfully');
    console.log('✓ Platform demo companies: SKEPL, AVSIL');
    console.log('✓ Agency demo orgs: NAGFOPS, NASRINS, PUNESVC, HRYOPS');
    console.log('✓ Rich demo data created across operations, inventory, logistics, insurance, PDI, regulatory reporting, service, claims, compliance, documents, notifications and agency workflow.');
  } catch (error) {
    console.error('Demo seed failed:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
})();
