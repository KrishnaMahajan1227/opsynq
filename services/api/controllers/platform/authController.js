const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const PlatformUser = require('../../models/platform/PlatformUser');
const Organization = require('../../models/platform/Organization');
const LegacyUser = require('../../models/User');
const platformAudit = require('../../utils/platformAudit');
const { capabilitiesForRole } = require('../../security/platformCapabilities');
const { validatePassword } = require('../../utils/passwordSecurity');
const { setSessionCookie, clearSessionCookie, demoBearerEnabled } = require('../../utils/sessionCookies');
const RealtimeRevision=require('../../models/RealtimeRevision');

const sign = (user) => jwt.sign(
  { id: user._id, role: user.role, organizationId: user.organizationId || null, scope: 'platform', tv: Number(user.tokenVersion || 0) },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN || '12h' }
);

const safeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  mobile: user.mobile,
  role: user.role,
  organizationId: user.organizationId,
  approvalStatus: user.approvalStatus,
  isActive: user.isActive,
  capabilities: capabilitiesForRole(user.role),
});

exports.login = async (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) return res.status(400).json({ message: 'Email/mobile and password are required.' });
  const normalized = String(identifier).trim().toLowerCase();
  const user = await PlatformUser.findOne({ $or: [{ email: normalized }, { mobile: String(identifier).trim() }] });
  if (!user) {
    const agencyUser = await LegacyUser.findOne({ mobile: String(identifier).trim() }).select('_id role isActive').lean();
    if (agencyUser) {
      return res.status(409).json({
        message: 'This is an Agency Operations account. Use the unified Opsynq sign-in.',
        code: 'AGENCY_ACCOUNT',
        agencyAppUrl: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}/agency/` : 'http://localhost:5174',
      });
    }
    return res.status(401).json({ message: 'Invalid credentials.' });
  }
  if (!(await bcrypt.compare(password, user.password))) return res.status(401).json({ message: 'Invalid credentials.' });
  if (!user.isActive) return res.status(403).json({ message: 'Account is inactive.' });
  if (user.approvalStatus !== 'APPROVED') return res.status(403).json({ message: `Account is ${user.approvalStatus.toLowerCase()}.` });
  user.lastLoginAt = new Date();
  await user.save();
  const token=sign(user);setSessionCookie(res,'platform',token);
  res.json({ ...(demoBearerEnabled(user)?{token}:{}), demo:demoBearerEnabled(user), user: safeUser(user) });
};

exports.me = async (req, res) => res.json({ user: safeUser(req.platformUser) });

exports.registerCompany = async (req, res) => {
  const { companyName, companyCode, country = 'India', state, contactName, email, mobile, password, address = {} } = req.body;
  if (!companyName || !companyCode || !contactName || !email || !mobile || !password) {
    return res.status(400).json({ message: 'Company name, code, contact name, email, mobile and password are required.' });
  }
  const passwordCheck = validatePassword(password);
  if (!passwordCheck.ok) return res.status(400).json({ message: passwordCheck.message });
  const code = String(companyCode).trim().toUpperCase();
  const existingOrg = await Organization.findOne({ code });
  if (existingOrg) return res.status(409).json({ message: 'Company code already exists.' });
  const identityClauses = [{ mobile: String(mobile).trim() }, { email: String(email).trim().toLowerCase() }];
  const [existingUser, existingAgencyUser] = await Promise.all([
    PlatformUser.findOne({ $or: identityClauses }),
    LegacyUser.findOne({ $or: identityClauses }).select('_id').lean(),
  ]);
  if (existingUser || existingAgencyUser) return res.status(409).json({ message: 'A user with this mobile/email already exists.' });

  const org = await Organization.create({
    name: companyName.trim(), code, type: 'COMPANY', country, state, status: 'PENDING',
    contact: { name: contactName.trim(), email: email?.trim().toLowerCase(), mobile: String(mobile).trim() },
    address,
    metadata: { registrationSource: 'self_service' },
  });
  const hashed = await bcrypt.hash(password, 12);
  const user = await PlatformUser.create({
    name: contactName.trim(), email: email?.trim().toLowerCase(), mobile: String(mobile).trim(), password: hashed,
    role: 'company_owner', organizationId: org._id, approvalStatus: 'PENDING', isActive: true,
  });
  await platformAudit(null, { actorId: user._id, actorType: 'company_owner', organizationId: org._id, companyId: org._id, action: 'COMPANY_REGISTRATION_SUBMITTED', entityType: 'Organization', entityId: org._id, after: { name: org.name, code: org.code } });
  res.status(201).json({ message: 'Registration submitted for Platform Superadmin approval.', registrationId: org._id });
};

exports.logout=(req,res)=>{clearSessionCookie(res,'platform');res.status(204).end();};

exports.revision=async(req,res)=>{let id=req.tenant?.companyId;if(req.platformUser?.role==='platform_superadmin'&&req.query.companyId){const company=await Organization.findOne({_id:req.query.companyId,type:'COMPANY',status:{$ne:'ARCHIVED'}}).select('_id').lean();if(!company)return res.status(404).json({message:'Company not found.'});id=company._id;}if(!id)return res.json({revision:0});const row=await RealtimeRevision.findOne({scopeKey:`company:${String(id)}`}).select('revision updatedAt -_id').lean();res.json({revision:Number(row?.revision||0),updatedAt:row?.updatedAt||null});};
