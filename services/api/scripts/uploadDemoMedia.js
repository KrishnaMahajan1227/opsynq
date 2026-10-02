const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { cloudinary } = require('../config/cloudinary');
const { DEMO_MEDIA_ROOT, DEMO_MEDIA_MANIFEST, DEMO_MEDIA_SPEC, requiredFiles } = require('../seed/demoMediaSpec');

const ALLOWED_EXT = new Set(['.jpg', '.jpeg']);
const sha256 = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function reachable(url) {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const res = await fetch(url, { method: 'GET', headers: { Range: 'bytes=0-32' }, redirect: 'follow', signal: AbortSignal.timeout(12000) });
      if (res.status === 200 || res.status === 206) return true;
    } catch {}
    if (attempt < 3) await sleep(600 * attempt);
  }
  return false;
}

(async () => {
  const required = requiredFiles();
  const missing = [];
  const hashes = new Map();
  for (const row of required) {
    const full = path.join(DEMO_MEDIA_ROOT, row.relativePath);
    if (!fs.existsSync(full)) { missing.push(row.relativePath); continue; }
    if (!ALLOWED_EXT.has(path.extname(full).toLowerCase())) throw new Error(`Only real JPG/JPEG files are accepted for demo media: ${row.relativePath}`);
    const size = fs.statSync(full).size;
    if (size < 40 * 1024) throw new Error(`Demo media file looks too small/placeholder-like (<40KB): ${row.relativePath}`);
    const digest = sha256(full);
    if (hashes.has(digest) && !row.allowDuplicate) throw new Error(`Duplicate image bytes are not allowed unless explicitly approved for a governed evidence reuse: ${row.relativePath} duplicates ${hashes.get(digest)}`);
    if (!hashes.has(digest)) hashes.set(digest, row.relativePath);
  }
  if (missing.length) throw new Error(`Missing ${missing.length} required real demo images:\n${missing.map(x => ` - ${x}`).join('\n')}`);

  const manifest = { version: 1, generatedAt: new Date().toISOString(), provider: 'cloudinary', beneficiaries: {} };
  for (const [beneficiaryId, spec] of Object.entries(DEMO_MEDIA_SPEC)) {
    const assets = {};
    for (const kind of spec.assets) {
      const relativePath = path.join(beneficiaryId, `${kind}.jpg`);
      const full = path.join(DEMO_MEDIA_ROOT, relativePath);
      const publicId = `${beneficiaryId}-${kind}`.toLowerCase();
      const result = await cloudinary.uploader.upload(full, {
        folder: `Opsynq/Demo/${beneficiaryId}`,
        public_id: publicId,
        resource_type: 'image',
        overwrite: true,
        unique_filename: false,
        use_filename: false,
        invalidate: true,
      });
      if (!result?.secure_url || !result?.public_id) throw new Error(`Cloudinary upload returned no URL/public_id for ${relativePath}`);
      if (!(await reachable(result.secure_url))) throw new Error(`Uploaded image URL is not reachable with HTTP 200/206: ${result.secure_url}`);
      assets[kind] = {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
        format: result.format,
        localFile: relativePath.replaceAll('\\', '/'),
        sha256: sha256(full),
      };
      process.stdout.write(`uploaded ${beneficiaryId}/${kind}\n`);
    }
    manifest.beneficiaries[beneficiaryId] = { stage: spec.stage, reason: spec.reason, assets };
  }
  fs.writeFileSync(DEMO_MEDIA_MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Real demo media manifest written: ${DEMO_MEDIA_MANIFEST}`);
})().catch(err => { console.error(`Demo media upload failed: ${err.message}`); process.exitCode = 1; });
