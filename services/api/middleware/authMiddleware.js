const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Import the User model to fetch user data

exports.protect = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided.' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Fetch the user from the database using the decoded ID
    const user = await User.findById(decoded.id).select('-password');
    if (!user || user.isActive === false) {
      return res.status(401).json({ message: 'User account is unavailable.' });
    }
    if (Number(decoded.tv || 0) !== Number(user.tokenVersion || 0)) {
      return res.status(401).json({ message: 'Session has been invalidated. Please sign in again.' });
    }
    req.user = user; // Attach the full user object to req.user
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token invalid.' });
  }
};