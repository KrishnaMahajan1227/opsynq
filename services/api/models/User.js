// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, lowercase: true, trim: true, default: undefined },
    mobile: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    tokenVersion: { type: Number, default: 0 },
    passwordChangedAt: { type: Date, default: null },
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null },
    lastFailedLoginAt: { type: Date, default: null },
    role: {
      type: String,
      enum: ['superadmin', 'admin', 'field_technician'],
      required: true,
    },
    isActive: { type: Boolean, default: true },
    lastLocation: {
      latitude: { type: Number },
      longitude: { type: Number },
      accuracy: { type: Number },
      address: { type: String, default: '' },
      capturedAt: { type: Date },
      updatedAt: { type: Date },
    },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('User', userSchema);


