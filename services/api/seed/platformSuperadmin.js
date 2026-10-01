require('dotenv').config();
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');
const PlatformUser = require('../models/platform/PlatformUser');
const Organization = require('../models/platform/Organization');

(async () => {
  await connectDB();
  const mobile = process.env.PLATFORM_SUPERADMIN_MOBILE;
  const password = process.env.PLATFORM_SUPERADMIN_PASSWORD;
  const email = process.env.PLATFORM_SUPERADMIN_EMAIL;
  const name = process.env.PLATFORM_SUPERADMIN_NAME || 'Opsynq Platform Superadmin';
  if (!mobile || !password) throw new Error('Set PLATFORM_SUPERADMIN_MOBILE and PLATFORM_SUPERADMIN_PASSWORD.');
  let platform = await Organization.findOne({ type: 'PLATFORM' });
  if (!platform) platform = await Organization.create({ name: 'Opsynq Platform', code: 'OPSYNQ', type: 'PLATFORM', status: 'ACTIVE', country: 'Global' });
  let user = await PlatformUser.findOne({ mobile });
  if (!user) {
    const hashed = await bcrypt.hash(password, 12);
    user = await PlatformUser.create({ name, email: email?.toLowerCase(), mobile, password: hashed, role: 'platform_superadmin', organizationId: platform._id, approvalStatus: 'APPROVED', isActive: true });
  }
  console.log(`Platform Superadmin ready: ${user.mobile}`);
  process.exit(0);
})().catch((err) => { console.error(err); process.exit(1); });
