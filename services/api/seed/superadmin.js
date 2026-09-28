const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require("bcryptjs");
const User = require('../models/User');

dotenv.config();

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
.then(() => {
  console.log('MongoDB connected for seeding superadmin');
  seedSuperAdmin();
})
.catch((err) => {
  console.error('MongoDB connection error:', err.message);
  process.exit(1);
});

async function seedSuperAdmin() {
  try {
    const existing = await User.findOne({ role: 'superadmin' });
    if (existing) {
      console.log('Superadmin already exists:', existing.username);
      process.exit(0);
    }
    const username = 'Krishna';
    const mobile = '7038255944';
    const password = 'Krishna';
    const hashedPassword = await bcrypt.hash(password, 10);
    const superadmin = new User({ username, mobile, password: hashedPassword, role: 'superadmin' });
    await superadmin.save();
    console.log('Superadmin created successfully with username:', username);
    process.exit(0);
  } catch (err) {
    console.error('Error creating superadmin:', err.message);
    process.exit(1);
  }
}
