const jwt = require('jsonwebtoken');
const PlatformUser = require('../../models/platform/PlatformUser');

const extractBearer = (req) => {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7).trim() : null;
};

exports.protectPlatform = async (req, res, next) => {
  try {
    const token = extractBearer(req);
    if (!token) return res.status(401).json({ message: 'Authentication required.' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.scope !== 'platform') return res.status(401).json({ message: 'Invalid session scope.' });
    const user = await PlatformUser.findById(decoded.id).select('-password').populate('organizationId', 'name code type status');
    if (!user || !user.isActive || user.approvalStatus !== 'APPROVED') {
      return res.status(403).json({ message: 'Account is not active or approved.' });
    }
    if (Number(decoded.tv || 0) !== Number(user.tokenVersion || 0)) {
      return res.status(401).json({ message: 'Session has been invalidated. Please sign in again.' });
    }
    req.platformUser = user;
    req.tenant = {
      organizationId: user.organizationId?._id || null,
      companyId: user.organizationId?.type === 'COMPANY' ? user.organizationId._id : null,
      role: user.role,
    };
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired session.' });
  }
};

exports.requirePlatformRoles = (...roles) => (req, res, next) => {
  if (!req.platformUser || !roles.includes(req.platformUser.role)) {
    return res.status(403).json({ message: 'Insufficient permission.' });
  }
  next();
};

exports.requireCompanyScope = (req, res, next) => {
  if (req.platformUser?.role === 'platform_superadmin') return next();
  if (!req.tenant?.companyId) return res.status(403).json({ message: 'Company scope required.' });
  next();
};
