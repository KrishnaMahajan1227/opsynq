const mongoose = require('mongoose');

const technicianChangeRequestSchema = new mongoose.Schema({
  farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Farmer', required: true },
  farmerDetails: {
    beneficiaryId: { type: String, required: true },
    beneficiaryName: { type: String, required: true },
    mobile: { type: String, required: true },
    aadharNo: { type: String, required: true },
  },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  requestedByDetails: {
    username: { type: String, required: true },
    mobile: { type: String, required: true },
    role: { type: String, required: true },
  },
  currentTechnician: {
    username: { type: String, default: '' },
    mobile: { type: String, default: '' },
  },
  newTechnician: {
    username: { type: String, required: false }, // Changed from required: true
    mobile: { type: String, required: false },   // Changed from required: true
  },
  reason: { type: String, required: true },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending',
  },
  requestDate: { type: Date, default: Date.now },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('TechnicianChangeRequest', technicianChangeRequestSchema);