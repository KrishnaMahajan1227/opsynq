const mongoose = require('mongoose');

const adminChangeLogSchema = new mongoose.Schema({
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  changeType: {
    type: String,
    enum: ['direct_update', 'excel_upload', 'jsr_update', 'technician_assignment', 'farmer_deletion'],
    required: true,
  },
  details: {
    farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Farmer' },
    farmerIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Farmer' }],
    changes: { type: Object },
    reason: { type: String },
  },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('AdminChangeLog', adminChangeLogSchema);