const path = require('path');

const DEMO_MEDIA_ROOT = path.resolve(__dirname, '../demo-media');
const DEMO_MEDIA_MANIFEST = path.join(DEMO_MEDIA_ROOT, 'cloudinary-manifest.json');

// Selected Maharashtra and Haryana beneficiary records are intentionally media-rich. The remaining
// demo beneficiaries keep clean empty states instead of fake/broken URLs.
// OPS-DM-019 is a fully cleared end-to-end demo record built only from images
// already generated in this project conversation; a few logical evidence slots
// intentionally reuse the same underlying photograph.
const DEMO_MEDIA_SPEC = {
  'OPS-DM-001': {
    stage: 'NEW',
    reason: 'Early-stage record using the available registration portrait and fictional DEMO identity card.',
    assets: ['beneficiary', 'id-proof'],
  },
  'OPS-DM-003': {
    stage: 'PROCESSING',
    reason: 'Processing-stage example using the available survey, consent, identity, signature and LR evidence.',
    assets: ['beneficiary', 'survey-site', 'water-source', 'id-proof', 'consent', 'signature', 'lr'],
  },
  'OPS-DM-014': {
    stage: 'PROCESSING',
    reason: 'Installation-in-progress example using the available survey/material and installation evidence.',
    assets: ['beneficiary', 'survey-site', 'water-source', 'id-proof', 'consent', 'signature', 'lr', 'install-before', 'install-during', 'serial-plate'],
  },  'OPS-HR-020': {
    stage: 'NEW',
    reason: 'Haryana registration example reusing approved demo-only media for a second-state walkthrough.',
    assets: ['beneficiary', 'id-proof'],
    allowDuplicateAssets: ['beneficiary','id-proof'],
  },
  'OPS-HR-024': {
    stage: 'PROCESSING',
    reason: 'Haryana processing example with survey/document/material evidence for cross-state demonstration.',
    assets: ['beneficiary', 'survey-site', 'water-source', 'id-proof', 'consent', 'signature', 'lr'],
    allowDuplicateAssets: ['beneficiary','survey-site','water-source','id-proof','consent','signature','lr'],
  },
  'OPS-HR-028': {
    stage: 'COMPLETED',
    reason: 'Haryana fully completed Rohtak example with end-to-end governed evidence for agency/technician demonstration.',
    assets: ['beneficiary', 'survey-site', 'water-source', 'id-proof', 'consent', 'signature', 'lr', 'install-before', 'install-during', 'install-after', 'serial-plate', 'final-beneficiary', 'final-signature', 'surveyor-signature'],
    allowDuplicateAssets: ['beneficiary','survey-site','water-source','id-proof','consent','signature','lr','install-before','install-during','install-after','serial-plate','final-beneficiary','final-signature','surveyor-signature'],
  },
  'OPS-HR-029': {
    stage: 'COMPLETED',
    reason: 'Haryana closed example with full demo evidence set for second-state storytelling.',
    assets: ['beneficiary', 'survey-site', 'water-source', 'id-proof', 'consent', 'signature', 'lr', 'install-before', 'install-during', 'install-after', 'serial-plate', 'final-beneficiary', 'final-signature', 'surveyor-signature'],
    allowDuplicateAssets: ['beneficiary','survey-site','water-source','id-proof','consent','signature','lr','install-before','install-during','install-after','serial-plate','final-beneficiary','final-signature','surveyor-signature'],
  },
  'OPS-DM-019': {
    stage: 'COMPLETED',
    reason: 'Fully cleared end-to-end record with survey, material, installation, commissioning and final-inspection evidence.',
    assets: ['beneficiary', 'survey-site', 'water-source', 'id-proof', 'consent', 'signature', 'lr', 'install-before', 'install-during', 'install-after', 'serial-plate', 'final-beneficiary', 'final-signature', 'surveyor-signature'],
    // This record intentionally reuses the already-approved demo photo set across logical evidence slots.
    // Keep this explicit allowlist narrow to this beneficiary; the uploader still rejects every
    // unapproved duplicate anywhere else in demo media.
    allowDuplicateAssets: ['beneficiary', 'survey-site', 'water-source', 'id-proof', 'consent', 'signature', 'lr', 'install-before', 'install-during', 'install-after', 'serial-plate', 'final-beneficiary', 'final-signature', 'surveyor-signature'],
  },
};

const filenameFor = (beneficiaryId, kind) => path.join(beneficiaryId, `${kind}.jpg`);
const requiredFiles = () => Object.entries(DEMO_MEDIA_SPEC).flatMap(([beneficiaryId, spec]) =>
  spec.assets.map(kind => ({ beneficiaryId, kind, relativePath: filenameFor(beneficiaryId, kind), stage: spec.stage, reason: spec.reason, allowDuplicate: (spec.allowDuplicateAssets || []).includes(kind) }))
);

function validateManifest(data) {
  const missing = [];
  for (const row of requiredFiles()) {
    const entry = data?.beneficiaries?.[row.beneficiaryId]?.assets?.[row.kind];
    if (!entry?.url || !entry?.publicId || !/^https:\/\//i.test(String(entry.url))) missing.push(`${row.beneficiaryId}/${row.kind}`);
  }
  if (missing.length) throw new Error(`Demo media manifest is incomplete (${missing.length} asset(s)): ${missing.join(', ')}`);
  return data;
}

function loadManifest({ required = false, validate = required } = {}) {
  const fs = require('fs');
  if (!fs.existsSync(DEMO_MEDIA_MANIFEST)) {
    if (required) throw new Error(`Real demo media manifest not found: ${DEMO_MEDIA_MANIFEST}. Add the required JPGs and run npm run demo:media:upload first.`);
    return { version: 1, beneficiaries: {} };
  }
  const data = JSON.parse(fs.readFileSync(DEMO_MEDIA_MANIFEST, 'utf8'));
  if (!data || typeof data !== 'object' || !data.beneficiaries) throw new Error('Invalid demo media manifest. Re-run npm run demo:media:upload.');
  return validate ? validateManifest(data) : data;
}

function asset(manifest, beneficiaryId, kind) {
  return manifest?.beneficiaries?.[beneficiaryId]?.assets?.[kind] || null;
}
function assetUrl(manifest, beneficiaryId, kind) { return asset(manifest, beneficiaryId, kind)?.url || ''; }
function assetPublicId(manifest, beneficiaryId, kind) { return asset(manifest, beneficiaryId, kind)?.publicId || ''; }
function publicIdMap(manifest, beneficiaryId) {
  const assets = manifest?.beneficiaries?.[beneficiaryId]?.assets || {};
  return Object.fromEntries(Object.entries(assets).map(([key, value]) => [key, value?.publicId || '']).filter(([, value]) => value));
}

module.exports = { DEMO_MEDIA_ROOT, DEMO_MEDIA_MANIFEST, DEMO_MEDIA_SPEC, requiredFiles, validateManifest, loadManifest, asset, assetUrl, assetPublicId, publicIdMap };
