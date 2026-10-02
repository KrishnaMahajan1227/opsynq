const mongoose = require('mongoose');
const { cleanupKnownDemoRmsBootstrap, validateTarget } = require('./demoDbGuard');

(async () => {
  const cleaned = await cleanupKnownDemoRmsBootstrap();
  console.log(`DEMO RMS cleanup completed: providers=${cleaned.providers}, rules=${cleaned.rules}`);
  await validateTarget({ destructive: false, write: true, requireClean: true });
  console.log('DEMO DB is clean and ready for seed.');
})().catch((error) => {
  console.error(`DEMO RMS cleanup blocked/failed: ${error.message}`);
  process.exitCode = 1;
}).finally(async () => {
  try { await mongoose.connection.close(); } catch {}
});
