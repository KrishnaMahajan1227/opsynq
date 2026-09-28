const mongoose = require('mongoose');

const changeRequestSchema = new mongoose.Schema({
  farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Farmer', required: true },
  farmerIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Farmer' }],
  requestType: {
    type: String,
    enum: [], // Removed 'technician_assignment' as it's handled by TechnicianChangeRequest
    required: true,
  },
  changes: {
    surveyorName: { type: String },
    surveyorMobile: { type: String },
    reworkAssignTechnician: { type: String },
  },
  reason: { type: String, required: true },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending',
  },
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('ChangeRequest', changeRequestSchema);