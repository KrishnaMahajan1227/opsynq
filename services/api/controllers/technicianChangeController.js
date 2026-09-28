const TechnicianChangeRequest = require('../models/TechnicianChangeRequest');
const Farmer = require('../models/Farmer');
const AdminChangeLog = require('../models/AdminChangeLog');
const mongoose = require('mongoose');

// POST /api/technician-change/request
exports.createChangeRequest = async (req, res) => {
  try {
    const { farmerId, newTechnicianUsername, reason } = req.body;
    const user = req.user;

    if (!mongoose.isValidObjectId(farmerId)) {
      return res.status(400).json({ message: 'Invalid farmer ID' });
    }
    if (!newTechnicianUsername || !reason) {
      return res.status(400).json({ message: 'New technician and reason are required' });
    }

    const farmer = await Farmer.findById(farmerId);
    if (!farmer) {
      return res.status(404).json({ message: 'Farmer not found' });
    }

    const newTechnician = await User.findOne({ username: newTechnicianUsername, role: 'field_technician' });
    if (!newTechnician) {
      return res.status(400).json({ message: 'Invalid technician selected' });
    }

    const existingRequest = await TechnicianChangeRequest.findOne({
      farmerId,
      status: 'Pending',
    });
    if (existingRequest) {
      return res.status(400).json({ message: 'A technician change request is already pending for this farmer' });
    }

    const changeRequest = await TechnicianChangeRequest.create({
      farmerId,
      farmerDetails: {
        beneficiaryId: farmer.beneficiaryId,
        beneficiaryName: farmer.beneficiaryName,
        mobile: farmer.mobile,
        aadharNo: farmer.aadharNo,
      },
      requestedBy: user._id,
      requestedByDetails: {
        username: user.username,
        mobile: user.mobile,
        role: user.role,
      },
      currentTechnician: {
        username: farmer.surveyorName || '',
        mobile: farmer.surveyorMobile || '',
      },
      newTechnician: {
        username: newTechnician.username,
        mobile: newTechnician.mobile,
      },
      reason,
      requestDate: new Date(),
    });

    // Log the action
    await AdminChangeLog.create({
      adminId: user._id,
      changeType: 'technician_assignment',
      details: {
        farmerId,
        changes: {
          currentTechnician: farmer.surveyorName,
          newTechnician: newTechnician.username,
        },
        reason,
      },
    });

    res.status(201).json({ message: 'Technician change request created successfully', changeRequest });
  } catch (err) {
    console.error('Error in createChangeRequest:', err.message);
    res.status(500).json({ message: 'Failed to create change request', error: err.message });
  }
};

// GET /api/technician-change/all
exports.getAllChangeRequests = async (req, res) => {
  try {
    const requests = await TechnicianChangeRequest.find()
      .populate('farmerId', 'beneficiaryName beneficiaryId mobile')
      .populate('requestedBy', 'username mobile')
      .populate('reviewedBy', 'username mobile')
      .lean();
    res.status(200).json(requests);
  } catch (err) {
    console.error('Error in getAllChangeRequests:', err.message);
    res.status(500).json({ message: 'Failed to fetch change requests', error: err.message });
  }
};

// GET /api/technician-change/my-requests
exports.getMyChangeRequests = async (req, res) => {
  try {
    const user = req.user;
    const requests = await TechnicianChangeRequest.find({ requestedBy: user._id })
      .populate('farmerId', 'beneficiaryName beneficiaryId mobile')
      .populate('reviewedBy', 'username mobile')
      .lean();
    res.status(200).json(requests);
  } catch (err) {
    console.error('Error in getMyChangeRequests:', err.message);
    res.status(500).json({ message: 'Failed to fetch your change requests', error: err.message });
  }
};

// PUT /api/technician-change/review/:requestId
exports.reviewChangeRequest = async (req, res) => {
  try {
    const requestId = req.params.requestId;
    const { status, reviewComments } = req.body;
    const user = req.user;

    if (user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Unauthorized to review change requests' });
    }
    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const request = await TechnicianChangeRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Change request not found' });
    }
    if (request.status !== 'Pending') {
      return res.status(400).json({ message: 'Change request is not pending' });
    }

    request.status = status;
    request.reviewedBy = user._id;
    request.reviewedByDetails = {
      username: user.username,
      mobile: user.mobile,
    };
    request.reviewDate = new Date();
    request.reviewComments = reviewComments || '';

    if (status === 'Approved') {
      // Apply the technician change
      const updateData = {
        surveyorName: request.newTechnician.username,
        surveyorMobile: request.newTechnician.mobile,
      };
      if (request.newTechnician.username === request.currentTechnician.reworkAssignTechnician) {
        updateData.reworkAssignTechnician = request.newTechnician.username;
      }
      await Farmer.findByIdAndUpdate(request.farmerId, { $set: updateData });
    }

    await request.save();

    // Log the action
    await AdminChangeLog.create({
      adminId: user._id,
      changeType: 'technician_assignment',
      details: {
        farmerId: request.farmerId,
        changes: status === 'Approved' ? {
          surveyorName: request.newTechnician.username,
          surveyorMobile: request.newTechnician.mobile,
        } : {},
        reason: `${status} technician change request ${requestId}`,
      },
    });

    res.status(200).json({ message: `Change request ${status.toLowerCase()} successfully` });
  } catch (err) {
    console.error('Error in reviewChangeRequest:', err.message);
    res.status(500).json({ message: 'Failed to review change request', error: err.message });
  }
};

// GET /api/technician-change/pending-count
exports.getPendingRequestsCount = async (req, res) => {
  try {
    const count = await TechnicianChangeRequest.countDocuments({ status: 'Pending' });
    res.status(200).json({ count });
  } catch (err) {
    console.error('Error in getPendingRequestsCount:', err.message);
    res.status(500).json({ message: 'Failed to fetch pending requests count', error: err.message });
  }
};

// GET /api/technician-change/my-pending-count
exports.getMyPendingRequestsCount = async (req, res) => {
  try {
    const user = req.user;
    const count = await TechnicianChangeRequest.countDocuments({
      requestedBy: user._id,
      status: 'Pending',
    });
    res.status(200).json({ count });
  } catch (err) {
    console.error('Error in getMyPendingRequestsCount:', err.message);
    res.status(500).json({ message: 'Failed to fetch your pending requests count', error: err.message });
  }
};