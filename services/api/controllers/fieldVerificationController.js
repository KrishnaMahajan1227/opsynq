const Farmer = require('../models/Farmer');
const mongoose = require('mongoose');
const { canAccessFarmer } = require('../utils/agencyScope');
const BeneficiaryContext = require('../models/platform/BeneficiaryContext');
const EvidenceRequirement = require('../models/platform/EvidenceRequirement');
const EvidenceSubmission = require('../models/platform/EvidenceSubmission');

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

    // Mirror agency survey uploads into the company evidence ledger so company users
    // see the same proof with clear provenance instead of relying only on legacy Farmer URLs.
    const ctx = await BeneficiaryContext.findOne({ farmerId }).lean();
    if (ctx?.companyId) {
      const geo = lat && lng ? {
        latitude: Number(lat), longitude: Number(lng), capturedAt: new Date(),
        source: 'DEVICE', capturedByUserId: req.user?._id,
        capturedByName: req.user?.username || req.user?.name || req.user?.mobile || 'Agency surveyor',
        capturedByRole: req.user?.role || 'surveyor'
      } : undefined;
      const proofSets = [
        { key: 'agency-beneficiary-photo', label: 'Beneficiary photo', files: req.files?.farmerPhoto || [] },
        { key: 'agency-site-survey-photos', label: 'Site survey photos', files: req.files?.sitePhotos || [] },
        { key: 'agency-beneficiary-signature', label: 'Beneficiary signature', files: req.files?.signature || [] },
      ];
      for (const proof of proofSets) {
        if (!proof.files.length) continue;
        const requirement = await EvidenceRequirement.findOneAndUpdate(
          { companyId: ctx.companyId, programId: ctx.programId || null, stage: 'SURVEY', key: proof.key },
          { $setOnInsert: { label: proof.label, evidenceType: proof.key.includes('signature') ? 'SIGNATURE' : 'PHOTO', required: true, minFiles: 1, sortOrder: proof.key.includes('site') ? 20 : 10, isActive: true } },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        const files = proof.files.map((file, index) => ({
          url: file.path, name: file.originalname || `${proof.key}-${index + 1}`, mimeType: file.mimetype || 'image/*', geo
        }));
        await EvidenceSubmission.findOneAndUpdate(
          { companyId: ctx.companyId, farmerId, requirementId: requirement._id },
          { $set: { workPackageId: ctx.workPackageId, agencyId: ctx.agencyId, stage: 'SURVEY', status: 'SUBMITTED', files, captureGeo: geo, submittedByLegacyUser: req.user?._id, value: { source: 'AGENCY_FIELD_SURVEY', inspectionStatus, surveyDate: surveyDate || new Date().toISOString() }, notes: `Submitted from Agency field verification by ${req.user?.username || req.user?.name || req.user?.mobile || 'surveyor'}.` } },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      }
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
