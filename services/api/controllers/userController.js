const User = require('../models/User');
const bcrypt = require("bcryptjs");
const mongoose = require('mongoose');
const AgencyUserLink = require('../models/platform/AgencyUserLink');
const PlatformUser = require('../models/platform/PlatformUser');
const { resolveAgencyScope } = require('../utils/agencyScope');
const { unscopedDemoAllowed } = require('../utils/sessionCookies');
const RealtimeRevision=require('../models/RealtimeRevision');
const { validatePassword } = require('../utils/passwordSecurity');


async function scopedLegacyUserIds(actor) {
  const scope = await resolveAgencyScope(actor);
  if (!scope.linked) return { scope, userIds: unscopedDemoAllowed(actor) ? null : [] };
  const links = await AgencyUserLink.find({ agencyId: { $in: scope.agencyIds }, isActive: true }).select('legacyUserId').lean();
  return { scope, userIds: [...new Set(links.map((x) => String(x.legacyUserId)).filter(Boolean))] };
}

async function assertManageableUser(actor, targetUserId) {
  const { scope, userIds } = await scopedLegacyUserIds(actor);
  if (!scope.linked) return true;
  return userIds.includes(String(targetUserId));
}

// POST /api/users/register
exports.register = async (req, res) => {
  try {
    const { username, email, mobile, password, role } = req.body;
    if (!username || !email || !mobile || !password || !role) {
      return res.status(400).json({ message: 'Username, email, mobile, password and role are required' });
    }

    const exist = await User.findOne({
      $or: [{ username }, { mobile }, ...(email ? [{ email: String(email).trim().toLowerCase() }] : [])],
    }).lean();
    const platformIdentity = await PlatformUser.findOne({ $or: [{ mobile }, { email: String(email).trim().toLowerCase() }] }).select('_id').lean();
    if (exist || platformIdentity) {
      return res.status(409).json({ message: 'Username, email or mobile already exists' });
    }

    const passwordCheck = validatePassword(password);
    if (!passwordCheck.ok) return res.status(400).json({ message: passwordCheck.message });
    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = await User.create({
      username,
      email: email ? String(email).trim().toLowerCase() : undefined,
      mobile,
      password: hashedPassword,
      role,
    });

    const scope = await resolveAgencyScope(req.user);
    if (scope.linked) {
      await Promise.all(scope.agencyIds.map((agencyId) => AgencyUserLink.findOneAndUpdate(
        { agencyId, legacyUserId: newUser._id },
        { $set: { companyId: scope.companyIds[0] || undefined, role, isActive: true } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )));
    }
    const userObj = newUser.toObject();
    delete userObj.password;
    res.status(201).json(userObj);
  } catch (err) {
    console.error('Error in register:', err.message);
    res.status(500).json({ message: 'Failed to register user' });
  }
};

// PUT /api/users/update/:id
exports.update = async (req, res) => {
  try {
    const userId = req.params.id;
    const { username, email, mobile, role, password } = req.body;
    if (!username || !mobile || !role) {
      return res.status(400).json({ message: 'Username, mobile, and role are required' });
    }

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ message: 'Invalid userId' });
    }

    if (!(await assertManageableUser(req.user, userId))) {
      return res.status(403).json({ message: 'You cannot manage a user outside your agency.' });
    }

    const duplicateClauses = [{ mobile }];
    if (email) duplicateClauses.push({ email: String(email).trim().toLowerCase() });
    const [duplicate, platformDuplicate] = await Promise.all([
      User.findOne({ _id: { $ne: userId }, $or: duplicateClauses }).lean(),
      PlatformUser.findOne({ $or: duplicateClauses }).select('_id').lean(),
    ]);
    if (duplicate || platformDuplicate) return res.status(409).json({ message: 'Mobile/email already exists' });

    const updateData = { username, email: email ? String(email).trim().toLowerCase() : undefined, mobile, role };
    if (password && password.trim() !== '') {
      const passwordCheck = validatePassword(password);
      if (!passwordCheck.ok) return res.status(400).json({ message: passwordCheck.message });
      const hashed = await bcrypt.hash(password, 12);
      updateData.password = hashed;
      updateData.passwordChangedAt = new Date();
      updateData.$inc = { tokenVersion: 1 };
    }

    let updateOperation = updateData;
    if (updateData.$inc) {
      const inc = updateData.$inc; delete updateData.$inc;
      updateOperation = { $set: updateData, $inc: inc };
    }
    const updatedUser = await User.findByIdAndUpdate(userId, updateOperation, {
      new: true,
      runValidators: true,
    }).select('-password').lean();
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    await AgencyUserLink.updateMany({ legacyUserId: updatedUser._id }, { $set: { role } });
    res.status(200).json(updatedUser);
  } catch (err) {
    console.error('Error in update:', err.message);
    res.status(500).json({ message: 'Failed to update user' });
  }
};

// DELETE /api/users/:id
exports.delete = async (req, res) => {
  try {
    const userId = req.params.id;
    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ message: 'Invalid userId' });
    }

    if (!(await assertManageableUser(req.user, userId))) {
      return res.status(403).json({ message: 'You cannot manage a user outside your agency.' });
    }
    const deleted = await User.findById(userId).select('-password').lean();
    if (!deleted) {
      return res.status(404).json({ message: 'User not found' });
    }
    await User.deleteOne({ _id: userId });
    await AgencyUserLink.deleteMany({ legacyUserId: userId });
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Error in delete:', err.message);
    res.status(500).json({ message: 'Failed to delete user' });
  }
};

// GET /api/users
exports.getUsers = async (req, res) => {
  try {
    const { userIds } = await scopedLegacyUserIds(req.user);
    const query = userIds ? { _id: { $in: userIds } } : {};
    if (req.query.role && ['superadmin','admin','field_technician'].includes(String(req.query.role))) query.role = String(req.query.role);
    if (req.query.active === 'true') query.isActive = true;
    if (req.query.active === 'false') query.isActive = false;
    const users = await User.find(query).select('-password').lean();
    res.status(200).json(users);
  } catch (err) {
    console.error('Error in getUsers:', err.message);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};

// GET /api/users/me
exports.getMyProfile = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'Authentication token or user ID is missing. Please log in again.' });
    }

    const user = await User.findById(req.user._id).select('-password').lean();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (err) {
    console.error('Error in getMyProfile:', err.message);
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
};

// GET /api/users/technicians
exports.getTechnicians = async (req, res) => {
  try {
    if (!['admin', 'superadmin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Unauthorized access to technician data' });
    }
    const { userIds } = await scopedLegacyUserIds(req.user);
    const technicians = await User.find({ role: 'field_technician', isActive: true, ...(userIds ? { _id: { $in: userIds } } : {}) })
      .select('username email mobile')
      .lean();
    res.status(200).json(technicians);
  } catch (err) {
    console.error('Error in getTechnicians:', err.message);
    res.status(500).json({ message: 'Failed to fetch technicians' });
  }
};
exports.getRealtimeRevision=async(req,res)=>{const scope=req.agencyScope||await resolveAgencyScope(req.user);if(!scope.linked&&!scope.demoUnscoped)return res.status(403).json({message:'Active Agency link required.'});const keys=[...(scope.agencyIds||[]).map(id=>`agency:${id}`),...(scope.companyIds||[]).map(id=>`company:${id}`)];if(!keys.length)return res.json({revision:0});const rows=await RealtimeRevision.find({scopeKey:{$in:keys}}).select('revision updatedAt -_id').lean();res.json({revision:rows.reduce((n,r)=>n+Number(r.revision||0),0),updatedAt:rows.map(r=>r.updatedAt).filter(Boolean).sort().at(-1)||null});};
