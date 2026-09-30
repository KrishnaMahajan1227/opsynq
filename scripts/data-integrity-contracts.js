const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const must = (condition, message) => {
  if (!condition) {
    console.error(`✗ ${message}`);
    process.exitCode = 1;
  } else console.log(`✓ ${message}`);
};

const conflict = read('services/api/utils/dataConflict.js');
const inventory = read('services/api/controllers/platform/inventoryController.js');
const operations = read('services/api/controllers/platform/operationsController.js');
const farmers = read('services/api/controllers/farmerController.js');
const common = read('apps/platform-web/src/components/common.jsx');
const inventoryUi = read('apps/platform-web/src/features/company/inventory/InventoryPages.jsx');
const operationsUi = read('apps/platform-web/src/features/company/operations/OperationsPages.jsx');
const configuration = read('services/api/controllers/platform/configurationController.js');
const configurationUi = read('apps/platform-web/src/features/company/configuration/ConfigurationCenter.jsx');
const companyUsers = read('services/api/controllers/platform/companyController.js');
const teamUi = read('apps/platform-web/src/features/company/system/TeamAccessPage.jsx');
const logistics = read('services/api/controllers/platform/logisticsController.js');
const logisticsUi = read('apps/platform-web/src/features/company/logistics/LogisticsPages.jsx');
const regulatory = read('services/api/controllers/platform/regulatoryController.js');
const regulatoryUi = read('apps/platform-web/src/features/company/assurance/RegulatoryPages.jsx');
const agencyUsers = read('services/api/controllers/userController.js');
const agencySuperadmin = read('apps/agency-web/src/pages/DashboardSuperAdmin.jsx');
const agencyDuplicate = read('apps/agency-web/src/components/DuplicateDecisionModal.jsx');

must(conflict.includes("kind:'DUPLICATE_RECORD'") && conflict.includes("['UPDATE','SKIP']"), 'structured duplicate conflict contract');
must(inventory.includes("kind:'BULK_DUPLICATES'") && inventory.includes('duplicateDecisions'), 'inventory bulk duplicate decisions');
must(operations.includes("kind:'BULK_DUPLICATES'") && operations.includes('duplicateDecisions'), 'beneficiary bulk duplicate decisions');
must(farmers.includes('differences') && farmers.includes("status: 'duplicatesFound'"), 'agency import duplicate field differences');
must(common.includes('ConflictResolutionDialog') && common.includes('BulkDuplicateResolutionDialog') && common.includes('confirmAction'), 'professional conflict and confirmation surfaces');
must(inventoryUi.includes('ConflictResolutionDialog') && inventoryUi.includes('BulkDuplicateResolutionDialog'), 'inventory duplicate resolver wired');
must(operationsUi.includes('ConflictResolutionDialog') && operationsUi.includes('BulkDuplicateResolutionDialog'), 'operations duplicate resolver wired');
must(configuration.includes('dataConflict.send') && configuration.includes("resolveDuplicate!=='UPDATE'"), 'master data duplicate resolution');
must(configurationUi.includes('ConflictResolutionDialog') && configurationUi.includes("save('UPDATE')"), 'master data duplicate resolver wired');
must(companyUsers.includes("entityType:'Team member'") && companyUsers.includes('allowedActions:sameCompany'), 'company user identity duplicate resolution');
must(teamUi.includes('ConflictResolutionDialog') && teamUi.includes('conflict.existingId'), 'company team duplicate resolver wired');
must(logistics.includes("entityType:'Driver'") && logistics.includes("entityType:'Vehicle'") && logistics.includes("entityType:'Shipment'"), 'fleet and dispatch identity duplicate checks');
must(logisticsUi.includes('ConflictResolutionDialog') && logisticsUi.includes('conflict.existingId'), 'fleet duplicate resolver wired');
must(regulatory.includes("entityType:'Insurance policy'") && regulatory.includes("entityType:'PDI record'"), 'insurance and PDI duplicate checks');
must(regulatoryUi.includes('ConflictResolutionDialog') && regulatoryUi.includes('updateDuplicate'), 'insurance and PDI duplicate resolver wired');
must(agencyUsers.includes("entityType:'Agency user'") && agencyUsers.includes('allowedActions:exist&&manageable'), 'Agency user duplicate resolution');
must(agencySuperadmin.includes('AgencyConflictResolutionModal') && agencySuperadmin.includes('userConflict'), 'Agency user duplicate resolver wired');
must(agencyDuplicate.includes('Update all') && agencyDuplicate.includes('Skip all') && agencyDuplicate.includes('Existing'), 'agency duplicate bulk resolver UX');

const businessRoots = [
  'apps/platform-web/src/features/company',
  'apps/agency-web/src/pages',
  'apps/agency-web/src/components'
];
const offenders = [];
const walk = (dir) => {
  for (const ent of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    const rel = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(rel);
    else if (/\.(jsx?|tsx?)$/.test(ent.name)) {
      const src = read(rel);
      if (/\bwindow\.(confirm|prompt)\s*\(|(?<![\w.])(confirm|prompt)\s*\(/.test(src)) offenders.push(rel);
    }
  }
};
businessRoots.forEach(walk);
must(offenders.length === 0, `no native confirm/prompt in business surfaces${offenders.length ? `: ${offenders.join(', ')}` : ''}`);

if (process.exitCode) process.exit(process.exitCode);
console.log('Data integrity contracts passed.');
