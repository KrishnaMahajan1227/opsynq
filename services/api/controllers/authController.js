// controllers/authController.js
const User = require('../models/User');
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
  try {
    const { mobile, password } = req.body;
    if (!mobile || !password)
      return res.status(400).json({ message: 'Please provide mobile number and password.' });
      
    const user = await User.findOne({ mobile });
    if (!user) return res.status(401).json({ message: 'Invalid credentials.' });
    
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials.' });
    
    if (user.isActive === false) return res.status(403).json({ message: 'Account is inactive.' });
    const token = jwt.sign({ id: user._id, role: user.role, scope: 'agency', tv: Number(user.tokenVersion || 0) }, process.env.JWT_SECRET, { expiresIn: process.env.AGENCY_JWT_EXPIRES_IN || '24h' });
    console.log(`User with mobile ${mobile} logged in.`);
    res.json({ token, user: { id: user._id, username: user.username, mobile: user.mobile, role: user.role } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: err.message });
  }
};
