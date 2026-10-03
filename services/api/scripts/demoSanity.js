const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { validateTarget, accountSnapshot } = require('./demoDbGuard');
const { loadManifest, DEMO_MEDIA_SPEC, requiredFiles } = require('../seed/demoMediaSpec');
const Farmer = require('../models/Farmer');
const Organization = require('../models/platform/Organization');
const BeneficiaryContext = require('../models/platform/BeneficiaryContext');
const WorkPackage = require('../models/platform/WorkPackage');
const InventorySerial = require('../models/platform/InventorySerial');
const InventoryBalance = require('../models/platform/InventoryBalance');
const InstalledAsset = require('../models/platform/InstalledAsset');
const MaterialIssue = require('../models/platform/MaterialIssue');
const StockMovement = require('../models/platform/StockMovement');
const AgencyUserLink = require('../models/platform/AgencyUserLink');
const EvidenceSubmission = require('../models/platform/EvidenceSubmission');
const DocumentRecord = require('../models/platform/DocumentRecord');
const AuditLog = require('../models/platform/AuditLog');
const ComplianceRecord = require('../models/platform/ComplianceRecord');
const RmsDevice = require('../models/platform/RmsDevice');
const RmsTelemetry = require('../models/platform/RmsTelemetry');
const RmsCurrentState = require('../models/platform/RmsCurrentState');

const fail = msg => { throw new Error(msg); };
const ok = msg => console.log(`✓ ${msg}`);
const id = value => String(value || '');
const sameIds = (a = [], b = []) => a.map(id).sort().join('|') === b.map(id).sort().join('|');

function latestBackupManifest(targetFingerprint) {
  const root = path.resolve(__dirname, '../backups');
  if (!fs.existsSync(root)) return null;
  return fs.readdirSync(root)
    .filter(name => name.startsWith('demo-reset-'))
    .map(name => path.join(root, name, 'manifest.json'))
    .filter(fs.existsSync)
    .map(file => { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; } })
    .filter(x => x?.complete && x.targetFingerprint === targetFingerprint)
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))[0] || null;
}

function mediaUrlsForFarmer(farmer) {
  const c = farmer.customFields || {};
  return [
    farmer.farmerPhotoUrl,
    ...(farmer.sitePhotosUrls || []),
    farmer.signatureUrl,
    farmer.installedPhotoUpload,
    farmer.finalfarmerPhotoUrl,
    ...(farmer.finalsitePhotosUrls || []),
    farmer.finalsignatureUrl,
    farmer.finalsurveyorsignatureUrl,
    ...(farmer.lrPhotoUrls || []),
    c.idProofUrl,
    c.consentDocumentUrl,
    c.waterSourcePhotoUrl,
    c.installationBeforeUrl,
    c.installationDuringUrl,
    c.serialPlateUrl,
    c.completionCertificateUrl,
    c.serviceEvidenceUrl,
  ].filter(Boolean);
}

async function urlReachable(url) {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { Range: 'bytes=0-32' },
      redirect: 'follow',
      signal: AbortSignal.timeout(12000),
    });
    return response.status === 200 || response.status === 206;
  } catch {
    return false;
  }
}

async function verifyUrls(urls) {
  const list = [...new Set(urls)];
  for (let i = 0; i < list.length; i += 8) {
    const batch = list.slice(i, i + 8);
    const states = await Promise.all(batch.map(async url => [url, await urlReachable(url)]));
    const bad = states.filter(([, reachable]) => !reachable).map(([url]) => url);
    if (bad.length) fail(`Image URL reachability failed (${bad.length}): ${bad.join(', ')}`);
  }
}

(async () => {
  const { id: db, protectedState } = await validateTarget({ destructive: false });

  const backup = latestBackupManifest(db.targetFingerprint);
  if (backup?.protectedAccountDigests) {
    const before = new Map(backup.protectedAccountDigests.map(x => [x.idDigest, x.stateDigest]));
    const after = accountSnapshot(protectedState);
    if (before.size !== after.length) fail('Protected account count changed after reset');
    for (const current of after) if (before.get(current.idDigest) !== current.stateDigest) fail(`Protected account identity/hash/role/tenant digest changed (${current.realm})`);
    ok('Protected account IDs, password hashes, roles and tenant mappings match the pre-reset digest snapshot');
  } else {
    console.log('! Protected-account backup comparison: not verified (no matching reset backup manifest found)');
  }

  const farmers = await Farmer.find({ beneficiaryId: /^OPS-(?:DM|HR)-/ }).lean();
  if (farmers.length !== 29) fail(`Expected exactly 29 demo beneficiaries, found ${farmers.length}`);
  const stageCounts = farmers.reduce((acc, farmer) => {
    const stage = farmer.customFields?.demoStageGroup || 'MISSING';
    acc[stage] = (acc[stage] || 0) + 1;
    return acc;
  }, {});
  const expectedStages = { NEW: 5, SURVEY: 5, PROCESSING: 9, COMPLETED: 8, ON_HOLD: 1, REJECTED: 1 };
  for (const [stage, count] of Object.entries(expectedStages)) if (stageCounts[stage] !== count) fail(`Lifecycle count mismatch ${stage}: ${stageCounts[stage] || 0} != ${count}`);
  ok('Exactly 29 beneficiaries across Maharashtra + Haryana with lifecycle split 5/5/9/8/1/1');

  const farmerIds = farmers.map(x => x._id);
  const farmerSet = new Set(farmerIds.map(id));
  const contexts = await BeneficiaryContext.find({ farmerId: { $in: farmerIds } }).lean();
  if (contexts.length !== 29 || contexts.some(x => !farmerSet.has(id(x.farmerId)))) fail('Beneficiary context count/orphan check failed');
  const orgs = await Organization.find({ _id: { $in: [...new Set(contexts.flatMap(x => [id(x.companyId), id(x.agencyId)]))] } }).lean();
  const orgMap = new Map(orgs.map(x => [id(x._id), x]));
  for (const context of contexts) {
    const agency = orgMap.get(id(context.agencyId));
    if (!agency || id(agency.parentOrganization) !== id(context.companyId)) fail(`Tenant leak/hierarchy mismatch for farmer ${context.farmerId}`);
  }
  ok('Company → Agency beneficiary context is tenant-scoped with no orphan hierarchy references');

  const wpIds = [...new Set(contexts.map(x => id(x.workPackageId)))];
  for (const workPackageId of wpIds) {
    const wp = await WorkPackage.findById(workPackageId).lean();
    const count = contexts.filter(x => id(x.workPackageId) === workPackageId).length;
    if (!wp || Number(wp.assignedQuantity) !== count) fail(`Work package assignedQuantity mismatch for ${wp?.code || workPackageId}: ${wp?.assignedQuantity} != ${count}`);
  }
  const links = await AgencyUserLink.find({ isActive: true }).lean();
  for (const context of contexts) if (!links.some(link => id(link.companyId) === id(context.companyId) && id(link.agencyId) === id(context.agencyId))) fail(`No active account mapping for agency ${context.agencyId}`);
  ok('Work-package quantities and agency account mappings are consistent');

  const companyIds = [...new Set(contexts.map(x => x.companyId))];
  const serials = await InventorySerial.find({ companyId: { $in: companyIds } }).lean();
  const uniqueSerials = new Set();
  for (const serial of serials) {
    const key = `${id(serial.companyId)}:${serial.serialNumber}`;
    if (uniqueSerials.has(key)) fail(`Duplicate inventory serial ${serial.serialNumber}`);
    uniqueSerials.add(key);
    if (['INSTALLED', 'ISSUED'].includes(serial.status) && !serial.farmerId) fail(`${serial.status} serial missing beneficiary: ${serial.serialNumber}`);
  }
  const balances = await InventoryBalance.find({ companyId: { $in: companyIds } }).lean();
  const groupKey = row => `${id(row.companyId)}:${id(row.itemId)}`;
  const serialGroups = new Map();
  for (const serial of serials) {
    const key = groupKey(serial);
    if (!serialGroups.has(key)) serialGroups.set(key, []);
    serialGroups.get(key).push(serial);
  }
  for (const [key, rows] of serialGroups) {
    const relatedBalances = balances.filter(balance => groupKey(balance) === key);
    const sum = field => relatedBalances.reduce((total, row) => total + Number(row[field] || 0), 0);
    const count = (...statuses) => rows.filter(row => statuses.includes(row.status)).length;
    if (sum('onHand') !== count('AVAILABLE', 'AGENCY_STOCK')) fail(`Inventory onHand mismatch for ${key}`);
    if (sum('allocated') !== count('ALLOCATED')) fail(`Inventory allocated mismatch for ${key}`);
    if (sum('inTransit') !== count('IN_TRANSIT')) fail(`Inventory inTransit mismatch for ${key}`);
    if (sum('damaged') !== count('DAMAGED')) fail(`Inventory damaged mismatch for ${key}`);
    const balanced = sum('onHand') + sum('allocated') + sum('inTransit') + sum('damaged') + count('INSTALLED', 'ISSUED');
    if (balanced !== rows.length) fail(`Inventory total does not reconcile for ${key}: ${balanced} != ${rows.length}`);
  }
  const assets = await InstalledAsset.find({ farmerId: { $in: farmerIds } }).lean();
  const assetBySerial = new Map(assets.map(asset => [id(asset.inventorySerialId), asset]));
  for (const serial of serials.filter(x => x.status === 'INSTALLED')) {
    const asset = assetBySerial.get(id(serial._id));
    if (!asset || id(asset.farmerId) !== id(serial.farmerId) || id(asset.companyId) !== id(serial.companyId) || id(asset.agencyId) !== id(serial.agencyId)) fail(`Installed serial/asset mismatch: ${serial.serialNumber}`);
  }
  ok('Inventory serials, balances, custody and installed assets reconcile');

  const issues = await MaterialIssue.find({ farmerId: { $in: farmerIds } }).lean();
  const movements = await StockMovement.find({ companyId: { $in: companyIds } }).lean();
  for (const issue of issues) {
    for (const line of issue.items || []) {
      const issueMovement = movements.find(m => m.movementType === 'ISSUE' && id(m.referenceId) === id(issue._id) && id(m.itemId) === id(line.itemId));
      if (!issueMovement || Number(issueMovement.quantity) !== Number(line.quantity) || !sameIds(issueMovement.serialIds, line.serialIds)) fail(`Material issue ledger mismatch: ${issue.issueNo}`);
      for (const serialId of line.serialIds || []) {
        const serial = serials.find(s => id(s._id) === id(serialId));
        if (!serial || id(serial.farmerId) !== id(issue.farmerId)) fail(`Material issue custody mismatch: ${issue.issueNo}`);
        if (issue.status === 'CONSUMED' && serial.status !== 'INSTALLED') fail(`Consumed issue does not map to installed serial: ${issue.issueNo}/${serial.serialNumber}`);
        if (issue.status === 'ISSUED' && serial.status !== 'ISSUED') fail(`Issued issue does not map to issued serial: ${issue.issueNo}/${serial.serialNumber}`);
      }
    }
  }
  for (const asset of assets) if (!movements.some(m => m.movementType === 'INSTALL' && id(m.referenceId) === id(asset._id) && (m.serialIds || []).some(x => id(x) === id(asset.inventorySerialId)))) fail(`Installed asset missing INSTALL ledger movement: ${asset.serialNumber}`);
  ok('Material issues and stock movement ledger match beneficiary/technician custody');

  const manifest = loadManifest({ required: true });
  const selectedIds = Object.keys(DEMO_MEDIA_SPEC).sort();
  if (selectedIds.length !== 8) fail(`Expected exactly eight media-rich beneficiaries in this packaged image set, found ${selectedIds.length}`);
  const manifestUrls = new Set(requiredFiles().map(row => manifest.beneficiaries[row.beneficiaryId].assets[row.kind].url));
  const manifestPublicIds = new Set(requiredFiles().map(row => manifest.beneficiaries[row.beneficiaryId].assets[row.kind].publicId));
  if (manifestUrls.size !== requiredFiles().length || manifestPublicIds.size !== requiredFiles().length) fail('Duplicate Cloudinary URL/public_id in media manifest');
  for (const farmer of farmers) {
    const urls = mediaUrlsForFarmer(farmer);
    if (!selectedIds.includes(farmer.beneficiaryId) && urls.length) fail(`Unselected beneficiary must use UI empty state, but media was linked: ${farmer.beneficiaryId}`);
    for (const url of urls) {
      if (/\/demo-media\//i.test(url) || !/^https:\/\//i.test(url)) fail(`Synthetic/broken demo media URL on ${farmer.beneficiaryId}: ${url}`);
      if (!manifestUrls.has(url)) fail(`Farmer media URL is outside the verified manifest: ${farmer.beneficiaryId}`);
    }
    const mapped = Object.values(farmer.customFields?.demoMediaPublicIds || {}).filter(Boolean);
    for (const publicId of mapped) if (!manifestPublicIds.has(publicId)) fail(`Farmer media public_id is outside manifest: ${farmer.beneficiaryId}`);
  }
  const evidence = await EvidenceSubmission.find({ farmerId: { $in: farmerIds } }).lean();
  for (const row of evidence) for (const file of row.files || []) {
    if (!file.url || !file.publicId || !manifestUrls.has(file.url) || !manifestPublicIds.has(file.publicId)) fail(`Evidence submission media linkage incomplete: ${row._id}`);
  }
  const docs = await DocumentRecord.find({ companyId: { $in: companyIds } }).lean();
  for (const doc of docs.filter(x => x.fileUrl)) if (!doc.publicId || !manifestUrls.has(doc.fileUrl) || !manifestPublicIds.has(doc.publicId)) fail(`DocumentRecord Cloudinary linkage incomplete: ${doc._id}`);
  await verifyUrls([...manifestUrls]);
  ok(`Eight selected beneficiaries use ${manifestUrls.size} governed Cloudinary image slots; all URLs return HTTP 200/206`);

  const cleared = farmers.find(f => f.beneficiaryId === 'OPS-DM-019');
  if (!cleared || cleared.applicationStatus !== 'Closed' || cleared.inspectionStatus !== 'Completed' || cleared.customFields?.fullyClearedDemo !== true) fail('OPS-DM-019 is not marked as the fully cleared closed record');
  const clearedAssets = assets.filter(a => id(a.farmerId) === id(cleared._id));
  if (clearedAssets.length !== 4) fail(`OPS-DM-019 installed asset count mismatch: ${clearedAssets.length} != 4`);
  const clearedIssue = issues.find(i => id(i.farmerId) === id(cleared._id));
  if (!clearedIssue || clearedIssue.status !== 'CONSUMED') fail('OPS-DM-019 material issue is not fully consumed');
  const clearedEvidence = evidence.filter(e => id(e.farmerId) === id(cleared._id));
  const requiredClearedEvidence = ['SURVEY','INSTALLATION','FINAL_INSPECTION'];
  if (clearedEvidence.length < 5 || requiredClearedEvidence.some(stage => !clearedEvidence.some(e => e.stage === stage && e.status === 'VERIFIED'))) fail('OPS-DM-019 required evidence is not fully verified across all stages');
  const clearedCompliance = await ComplianceRecord.findOne({ farmerId: cleared._id, type: 'FINAL_INSPECTION' }).lean();
  if (!clearedCompliance || clearedCompliance.status !== 'PASS' || (clearedCompliance.items || []).some(item => item.status !== 'PASS')) fail('OPS-DM-019 final inspection/compliance is not fully PASS');
  ok('OPS-DM-019 is fully cleared: closed lifecycle, consumed material custody, installed assets, verified stage evidence and PASS final inspection');


  const haryanaAgency = await Organization.findOne({ code: 'HRYOPS', type: 'AGENCY', state: 'Haryana' }).lean();
  if (!haryanaAgency) fail('Dedicated Haryana agency HRYOPS is missing');
  const haryanaFarmers = farmers.filter(f => /^OPS-HR-/.test(f.beneficiaryId));
  const haryanaContexts = contexts.filter(c => haryanaFarmers.some(f => id(f._id) === id(c.farmerId)));
  if (haryanaContexts.length !== 10 || haryanaContexts.some(c => id(c.agencyId) !== id(haryanaAgency._id))) fail('Haryana beneficiary-to-agency mapping is not fully assigned to HRYOPS');
  for (const beneficiaryId of ['OPS-HR-028','OPS-HR-029']) {
    const farmer = farmers.find(f => f.beneficiaryId === beneficiaryId);
    if (!farmer || farmer.applicationStatus !== 'Closed' || farmer.customFields?.fullyClearedDemo !== true) fail(`${beneficiaryId} is not fully closed`);
    const fa = assets.filter(a => id(a.farmerId) === id(farmer._id));
    if (fa.length !== 4 || fa.some(a => id(a.agencyId) !== id(haryanaAgency._id))) fail(`${beneficiaryId} installed assets are not fully mapped to HRYOPS`);
    const fi = issues.find(i => id(i.farmerId) === id(farmer._id));
    if (!fi || fi.status !== 'CONSUMED' || id(fi.agencyId) !== id(haryanaAgency._id)) fail(`${beneficiaryId} material custody is not fully consumed under HRYOPS`);
    const fe = evidence.filter(e => id(e.farmerId) === id(farmer._id));
    if (requiredClearedEvidence.some(stage => !fe.some(e => e.stage === stage && e.status === 'VERIFIED'))) fail(`${beneficiaryId} required governed evidence is incomplete`);
    const fc = await ComplianceRecord.findOne({ farmerId: farmer._id, type: 'FINAL_INSPECTION' }).lean();
    if (!fc || fc.status !== 'PASS' || id(fc.agencyId) !== id(haryanaAgency._id)) fail(`${beneficiaryId} final inspection is not PASS under HRYOPS`);
  }
  ok('All 10 Haryana beneficiaries are mapped to HRYOPS; OPS-HR-028 and OPS-HR-029 are fully cleared with governed evidence');

  const rmsDevices = await RmsDevice.find({ companyId: { $in: companyIds }, 'metadata.simulated': true }).lean();
  if (!rmsDevices.length) fail('Demo RMS was not primed before sanity verification');
  const activeRms = rmsDevices.filter(x => x.lifecycleStatus !== 'DECOMMISSIONED');
  const mappedFarmers = activeRms.map(x => id(x.farmerId)).filter(Boolean);
  if (new Set(mappedFarmers).size !== mappedFarmers.length) fail('Duplicate active RMS device mappings exist for a beneficiary');
  const states = await RmsCurrentState.find({ deviceId: { $in: rmsDevices.map(x => x._id) } }).lean();
  if (!states.length) fail('Demo RMS current state is missing');
  for (const device of activeRms) {
    const historyCount = await RmsTelemetry.countDocuments({ deviceId: device._id });
    if (historyCount < 10) fail(`RMS telemetry history is incomplete for ${device.externalDeviceId}: ${historyCount} readings`);
  }
  ok(`RMS is primed with ${rmsDevices.length} canonical demo devices, current state and multi-reading telemetry history`);

  for (const farmer of farmers) {
    const logs = await AuditLog.countDocuments({ entityType: 'Farmer', entityId: farmer._id, companyId: contexts.find(c => id(c.farmerId) === id(farmer._id))?.companyId });
    if (!logs) fail(`Beneficiary has no audit trail: ${farmer.beneficiaryId}`);
  }
  ok('Every beneficiary has a tenant-scoped audit trail');

  console.log('✓ Demo sanity verification passed');
})().catch(error => {
  console.error(`✗ Demo sanity failed: ${error.message}`);
  process.exitCode = 1;
}).finally(async () => {
  try { await mongoose.connection.close(); } catch {}
});
