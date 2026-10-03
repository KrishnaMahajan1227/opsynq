const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const seed = fs.readFileSync(path.join(root, 'services/api/seed/demoData.js'), 'utf8');
const guard = fs.readFileSync(path.join(root, 'services/api/scripts/demoDbGuard.js'), 'utf8');
const uploader = fs.readFileSync(path.join(root, 'services/api/scripts/uploadDemoMedia.js'), 'utf8');
const { DEMO_MEDIA_SPEC, requiredFiles } = require('../services/api/seed/demoMediaSpec');
const must = (condition, message) => { if (!condition) throw new Error(message); console.log(`✓ ${message}`); };

const companyMobiles = ['9000000001','9000000002','9000000003','9000000004','9000000005','9000000006','9000000007','9000000008','9100000001','9100000002','9100000003','9100000004','9100000005'];
const agencyMobiles = ['9200000001','9200000002','9200000003','9200000004','9300000001','9300000002','9300000003','9300000004','9400000001','9400000002','9400000003'];
for (const mobile of [...companyMobiles, ...agencyMobiles]) must(seed.includes(`mobile: '${mobile}'`), `Existing demo account contract includes ${mobile}`);
must(seed.includes('requirePlatformUser') && seed.includes('requireLegacyUser'), 'Seed requires existing demo accounts instead of creating credentials');
must(!seed.includes('bcrypt.hash') && !seed.includes('DEMO_DEFAULT_PASSWORD'), 'Seed does not generate/reset demo passwords');
must(seed.includes("validateTarget({ destructive: false, write: true, requireClean: true })"), 'Seed requires clean DB plus explicit demo/dev write classification');
must(guard.includes("(write||destructive)&&!['demo','dev','test'].includes(purpose)"), 'DB guard blocks writes unless target is explicitly demo/dev/test');
must(guard.includes('cleanupKnownDemoRmsBootstrap') && guard.includes("DEMO-RMS") && guard.includes("DEMO_SIMULATOR"), 'Seed guard safely handles only auto-recreated demo RMS bootstrap docs during authorized reset');
must(seed.includes('cleanupKnownDemoRmsBootstrap()'), 'Seed invokes guarded RMS bootstrap race cleanup before clean-state validation');

for (let i = 1; i <= 19; i += 1) must(seed.includes(`OPS-DM-${String(i).padStart(3, '0')}`), `Beneficiary OPS-DM-${String(i).padStart(3, '0')} is present`);
for (let i = 20; i <= 24; i += 1) must(!seed.includes(`OPS-DM-${String(i).padStart(3, '0')}`), `Legacy beneficiary OPS-DM-${String(i).padStart(3, '0')} is absent`);
for (const token of ["'OPS-DM-001':'NEW'", "'OPS-DM-002':'SURVEY'", "'OPS-DM-003':'PROCESSING'", "'OPS-DM-004':'COMPLETED'", "'OPS-DM-017':'ON_HOLD'", "'OPS-DM-018':'REJECTED'"]) must(seed.includes(token), `Lifecycle contract ${token} exists`);

const selected = Object.keys(DEMO_MEDIA_SPEC);
must(selected.length === 7, 'Exactly seven beneficiaries are media-rich in the packaged image set');
must(requiredFiles().length === 56, 'Exactly 56 governed packaged image slots are required, including the fully cleared record');
for (const row of requiredFiles()) {
  const folder = path.join(root, 'services/api/demo-media', row.beneficiaryId);
  must(fs.existsSync(folder), `Media folder exists: ${row.beneficiaryId}`);
}
must(!seed.includes('/demo-media/') && !seed.includes('.png'), 'Seed contains no synthetic local demo-media PNG URL');
must(uploader.includes('Duplicate image bytes are not allowed') && uploader.includes('40 * 1024') && uploader.includes('HTTP 200/206'), 'Uploader rejects duplicates/placeholders and verifies reachable URLs');

const mapping = fs.readFileSync(path.join(root, 'services/api/demo-media/mapping.csv'), 'utf8').trim().split(/\r?\n/);
must(mapping.length === 57, 'Media mapping table has one header plus 56 assets');
console.log('✓ Demo seed source contracts passed');
