const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { DEMO_MEDIA_ROOT, requiredFiles } = require('../services/api/seed/demoMediaSpec');

const seen = new Map();
let duplicateCount = 0;
for (const row of requiredFiles()) {
  const full = path.join(DEMO_MEDIA_ROOT, row.relativePath);
  if (!fs.existsSync(full)) throw new Error(`Missing demo media: ${row.relativePath}`);
  const digest = crypto.createHash('sha256').update(fs.readFileSync(full)).digest('hex');
  if (seen.has(digest)) {
    duplicateCount += 1;
    if (!row.allowDuplicate) {
      throw new Error(`Unapproved duplicate: ${row.relativePath} duplicates ${seen.get(digest)}`);
    }
  } else {
    seen.set(digest, row.relativePath);
  }
}
if (!duplicateCount) throw new Error('Expected governed demo-media reuse but found no duplicate bytes');
console.log(`✓ Demo media duplicate governance passed (${duplicateCount} explicitly approved reused files)`);
