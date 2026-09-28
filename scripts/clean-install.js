const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
for (const name of ['node_modules', 'package-lock.json']) {
  const target = path.join(root, name);
  if (fs.existsSync(target)) {
    console.log(`Removing ${target}`);
    fs.rmSync(target, { recursive: true, force: true });
  }
}
console.log('Cleaned workspace install artifacts. Now run: npm install');
