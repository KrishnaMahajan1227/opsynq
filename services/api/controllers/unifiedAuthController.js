const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const PlatformUser = require('../models/platform/PlatformUser');
const LegacyUser = require('../models/User');
const AuthHandoff = require('../models/AuthHandoff');
const PasswordResetToken = require('../models/PasswordResetToken');
const { capabilitiesForRole } = require('../security/platformCapabilities');
const { validatePassword, passwordHelp } = require('../utils/passwordSecurity');
const { sendEmail, passwordResetMessage } = require('../utils/emailService');
const { recordSecurityEvent } = require('../utils/securityEvents');

const normalize = (value) => String(value || '').trim();
const normalizeEmail = (value) => normalize(value).toLowerCase();
const hashCode = (code) => crypto.createHash('sha256').update(code).digest('hex');
const RESET_TTL_MS = 20 * 60 * 1000;
const LOCK_THRESHOLD = 5;
const LOCK_MS = 15 * 60 * 1000;

const safePlatformUser = (user) => ({
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

const safeAgencyUser = (user) => ({
  id: user._id,
  username: user.username,
  email: user.email,
  mobile: user.mobile,
  role: user.role,
});

const signPlatform = (user) => jwt.sign(
  { id: user._id, role: user.role, organizationId: user.organizationId || null, scope: 'platform', tv: Number(user.tokenVersion || 0) },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN || '12h' }
);

const signAgency = (user) => jwt.sign(
  { id: user._id, role: user.role, scope: 'agency', tv: Number(user.tokenVersion || 0) },
  process.env.JWT_SECRET,
  { expiresIn: process.env.AGENCY_JWT_EXPIRES_IN || '24h' }
);

const isLocked = (user) => Boolean(user?.lockUntil && new Date(user.lockUntil).getTime() > Date.now());

async function recordFailure(user) {
  if (!user) return;
  const now = new Date();
  const nextAttempts = Number(user.failedLoginAttempts || 0) + 1;
  user.failedLoginAttempts = nextAttempts;
  user.lastFailedLoginAt = now;
  if (nextAttempts >= LOCK_THRESHOLD) {
    user.lockUntil = new Date(Date.now() + LOCK_MS);
    user.failedLoginAttempts = 0;
  }
  await user.save();
}

async function clearFailures(user) {
  if (!user) return;
  if (user.failedLoginAttempts || user.lockUntil || user.lastFailedLoginAt) {
    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    user.lastFailedLoginAt = null;
  }
}

async function findIdentity(identifier) {
  const normalized = normalize(identifier);
  const email = normalizeEmail(identifier);
  let user = await PlatformUser.findOne({ $or: [{ email }, { mobile: normalized }] });
  if (user) return { realm: 'platform', user };
  user = await LegacyUser.findOne({ $or: [{ email }, { mobile: normalized }] });
  if (user) return { realm: 'agency', user };
  return null;
}

exports.login = async (req, res) => {
  const identifier = normalize(req.body.identifier || req.body.mobile || req.body.email);
  const password = String(req.body.password || '');
  if (!identifier || !password) return res.status(400).json({ message: 'Email/mobile and password are required.' });

  const identity = await findIdentity(identifier);
  if (!identity) {
    await recordSecurityEvent(req, { realm: 'system', action: 'LOGIN_FAILED', success: false, identifier });
    return res.status(401).json({ message: 'Invalid credentials.' });
  }

  const { realm, user } = identity;
  if (isLocked(user)) {
    await recordSecurityEvent(req, { realm, action: 'LOGIN_BLOCKED_LOCKED', success: false, identifier, userId: user._id });
    return res.status(429).json({ message: 'Too many failed sign-in attempts. Try again later or reset your password.' });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    await recordFailure(user);
    await recordSecurityEvent(req, { realm, action: 'LOGIN_FAILED', success: false, identifier, userId: user._id });
    return res.status(401).json({ message: 'Invalid credentials.' });
  }

  if (!user.isActive) {
    await recordSecurityEvent(req, { realm, action: 'LOGIN_REJECTED_INACTIVE', success: false, identifier, userId: user._id });
    return res.status(403).json({ message: 'Account is inactive.' });
  }
  if (realm === 'platform' && user.approvalStatus !== 'APPROVED') {
    await recordSecurityEvent(req, { realm, action: 'LOGIN_REJECTED_APPROVAL', success: false, identifier, userId: user._id });
    return res.status(403).json({ message: `Account is ${user.approvalStatus.toLowerCase()}.` });
  }

  await clearFailures(user);
  if (realm === 'platform') user.lastLoginAt = new Date();
  await user.save();
  await recordSecurityEvent(req, { realm, action: 'LOGIN_SUCCEEDED', identifier, userId: user._id });

  if (realm === 'platform') {
    return res.json({ realm: 'platform', token: signPlatform(user), user: safePlatformUser(user), destination: 'platform' });
  }

  const code = crypto.randomBytes(32).toString('hex');
  await AuthHandoff.deleteMany({ legacyUserId: user._id, usedAt: null });
  await AuthHandoff.create({
    codeHash: hashCode(code),
    legacyUserId: user._id,
    expiresAt: new Date(Date.now() + 60 * 1000),
    ip: req.ip,
    userAgent: String(req.get('user-agent') || '').slice(0, 500),
  });
  return res.json({ realm: 'agency', handoffCode: code, destination: 'agency', user: safeAgencyUser(user) });
};

exports.exchangeAgencyHandoff = async (req, res) => {
  const code = normalize(req.body.code);
  if (!code) return res.status(400).json({ message: 'Secure handoff code is required.' });
  const handoff = await AuthHandoff.findOne({ codeHash: hashCode(code), usedAt: null });
  if (!handoff || handoff.expiresAt <= new Date()) {
    return res.status(401).json({ message: 'Secure sign-in handoff expired. Please sign in again.' });
  }
  const user = await LegacyUser.findById(handoff.legacyUserId);
  if (!user || !user.isActive) return res.status(401).json({ message: 'Agency account is unavailable.' });
  handoff.usedAt = new Date();
  await handoff.save();
  await recordSecurityEvent(req, { realm: 'agency', action: 'AGENCY_HANDOFF_EXCHANGED', userId: user._id });
  return res.json({ token: signAgency(user), user: safeAgencyUser(user) });
};

exports.forgotPassword = async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const generic = { message: 'If an active account with that email exists, a password reset link will be sent shortly.' };
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) return res.status(200).json(generic);

  const [platformUser, agencyUser] = await Promise.all([
    PlatformUser.findOne({ email }),
    LegacyUser.findOne({ email }),
  ]);
  // Unified identities must be unique across realms. If historic data contains
  // the same email in both realms, refuse recovery rather than resetting the wrong account.
  if (platformUser && agencyUser) {
    await recordSecurityEvent(req, { realm: 'system', action: 'PASSWORD_RESET_IDENTITY_CONFLICT', success: false, identifier: email });
    return res.status(200).json(generic);
  }
  const user = platformUser || agencyUser;
  const realm = platformUser ? 'platform' : agencyUser ? 'agency' : 'system';

  await recordSecurityEvent(req, { realm, action: 'PASSWORD_RESET_REQUESTED', userId: user?._id || null, identifier: email });
  if (!user || !user.isActive || (realm === 'platform' && user.approvalStatus !== 'APPROVED')) return res.status(200).json(generic);

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashCode(rawToken);
  await PasswordResetToken.updateMany({ realm, userId: user._id, usedAt: null }, { $set: { usedAt: new Date() } });
  await PasswordResetToken.create({
    tokenHash,
    realm,
    userId: user._id,
    email,
    expiresAt: new Date(Date.now() + RESET_TTL_MS),
    requestedIp: String(req.ip || '').slice(0, 120),
    requestedUserAgent: String(req.get('user-agent') || '').slice(0, 500),
  });

  try {
    const message = passwordResetMessage({ to: email, name: realm === 'platform' ? user.name : user.username, token: rawToken });
    await sendEmail(message);
    await recordSecurityEvent(req, { realm, action: 'PASSWORD_RESET_EMAIL_SENT', userId: user._id, identifier: email });
  } catch (error) {
    console.error('Password reset email failed:', error.message);
    await recordSecurityEvent(req, { realm, action: 'PASSWORD_RESET_EMAIL_FAILED', success: false, userId: user._id, identifier: email, metadata: { reason: String(error.message).slice(0, 180) } });
    await PasswordResetToken.updateOne({ tokenHash, usedAt: null }, { $set: { usedAt: new Date() } });
  }
  return res.status(200).json(generic);
};

exports.validateResetToken = async (req, res) => {
  const token = normalize(req.body.token);
  if (!token) return res.status(400).json({ valid: false, message: 'Reset token is required.' });
  const record = await PasswordResetToken.findOne({ tokenHash: hashCode(token), usedAt: null });
  const valid = Boolean(record && record.expiresAt > new Date());
  return res.status(valid ? 200 : 400).json({ valid, message: valid ? 'Reset link is valid.' : 'Reset link is invalid or expired.' });
};

exports.resetPassword = async (req, res) => {
  const token = normalize(req.body.token);
  const password = String(req.body.password || '');
  if (!token || !password) return res.status(400).json({ message: 'Reset token and new password are required.' });
  const validation = validatePassword(password);
  if (!validation.ok) return res.status(400).json({ message: validation.message, passwordHelp: passwordHelp() });

  const candidate = await PasswordResetToken.findOne({ tokenHash: hashCode(token), usedAt: null, expiresAt: { $gt: new Date() } });
  if (!candidate) return res.status(400).json({ message: 'Reset link is invalid or expired.' });

  const Model = candidate.realm === 'platform' ? PlatformUser : LegacyUser;
  const user = await Model.findById(candidate.userId);
  if (!user || !user.isActive || (candidate.realm === 'platform' && user.approvalStatus !== 'APPROVED')) {
    await PasswordResetToken.updateOne({ _id: candidate._id, usedAt: null }, { $set: { usedAt: new Date() } });
    return res.status(400).json({ message: 'Reset link is invalid or expired.' });
  }

  if (await bcrypt.compare(password, user.password)) return res.status(400).json({ message: 'New password must be different from your current password.' });

  const record = await PasswordResetToken.findOneAndUpdate(
    { _id: candidate._id, usedAt: null, expiresAt: { $gt: new Date() } },
    { $set: { usedAt: new Date(), consumedIp: String(req.ip || '').slice(0, 120), consumedUserAgent: String(req.get('user-agent') || '').slice(0, 500) } },
    { new: true }
  );
  if (!record) return res.status(400).json({ message: 'Reset link is invalid or expired.' });

  user.password = await bcrypt.hash(password, 12);
  user.passwordChangedAt = new Date();
  user.tokenVersion = Number(user.tokenVersion || 0) + 1;
  user.failedLoginAttempts = 0;
  user.lockUntil = null;
  user.lastFailedLoginAt = null;
  await user.save();
  await PasswordResetToken.updateMany({ realm: record.realm, userId: user._id, usedAt: null }, { $set: { usedAt: new Date() } });
  await AuthHandoff.deleteMany({ legacyUserId: user._id, usedAt: null });
  await recordSecurityEvent(req, { realm: record.realm, action: 'PASSWORD_RESET_COMPLETED', userId: user._id, identifier: record.email });

  return res.json({ message: 'Password updated successfully. All previous sessions have been invalidated. Please sign in again.' });
};
