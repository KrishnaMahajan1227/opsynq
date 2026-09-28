const Farmer = require('../models/Farmer');
const mongoose = require('mongoose');
const { canAccessFarmer } = require('../utils/agencyScope');

exports.submitFieldVerification = async (req, res) => {
  try {
    const farmerId = req.params.id;
    if (!mongoose.isValidObjectId(farmerId)) return res.status(400).json({ message: 'Invalid farmer ID.' });
    const farmer = await Farmer.findById(farmerId).lean();
    if (!farmer) return res.status(404).json({ message: 'Farmer record not found.' });
    if (!(await canAccessFarmer(req.user, farmer))) return res.status(403).json({ message: 'You do not have access to this beneficiary.' });
    const {
      siteDepth,
      status,
      lat,
      lng,
      surveyDate,
      landHoldingAcre,
      landOwnershipType,
      actualHeadM,
      sourceDepthFeet,
      jsrDeviationYesNo,
      deviationRemarks
    } = req.body;

    // 1) Determine inspectionStatus (Done/Completed → 'Completed')
    const inspectionStatus = ['Done', 'Completed'].includes(status)
      ? 'Completed'
      : status;

    // 2) Build update object (remove automatic applicationStatus bump)
    const updateObj = {
      siteDepth,
      inspectionStatus,
      // no longer auto-setting applicationStatus here
      siteLocation: lat && lng ? `${lat},${lng}` : undefined,
      landHoldingAcre,
      landOwnershipType,
      actualHeadM,
      sourceDepthFeet,
      jsrDeviationYesNo,
      deviationRemarks,
      ...(surveyDate && { surveyDate: new Date(surveyDate) })
    };

    // 3) Attach any uploaded photos & signature URLs
    if (req.files?.farmerPhoto?.[0]) {
      updateObj.farmerPhotoUrl = req.files.farmerPhoto[0].path;
    }
    if (req.files?.sitePhotos?.length) {
      updateObj.sitePhotosUrls = req.files.sitePhotos.map(f => f.path);
    }
    if (req.files?.signature?.[0]) {
      updateObj.signatureUrl = req.files.signature[0].path;
    }

    // 4) Persist to DB
    const updatedFarmer = await Farmer.findByIdAndUpdate(
      farmerId,
      { $set: updateObj },
      { new: true }
    );
    if (!updatedFarmer) {
      return res.status(404).json({ message: 'Farmer record not found.' });
    }

    return res.json({
      message: 'Field verification submitted successfully.',
      farmer: updatedFarmer
    });
  } catch (err) {
    console.error('Error in field verification:', err);
    return res.status(500).json({ message: err.message || 'Server error' });
  }
};
