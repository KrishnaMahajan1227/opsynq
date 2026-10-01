const Farmer = require('../models/Farmer');
const mongoose = require('mongoose');
const { canAccessFarmer } = require('../utils/agencyScope');
const BeneficiaryContext = require('../models/platform/BeneficiaryContext');
const EvidenceRequirement = require('../models/platform/EvidenceRequirement');
const EvidenceSubmission = require('../models/platform/EvidenceSubmission');
const { publishAgencyProgress } = require('../utils/agencyLifecycle');
const { getStageRequirements, syncConfiguredEvidence, requiredEvidenceState } = require('../utils/evidenceRuntime');

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

    // Mirror Agency survey uploads into the Company's configured evidence ledger.
    // Do not create duplicate requirements when the Company has already defined its
    // own checklist. Legacy defaults are created only when no SURVEY rules exist.
    const ctx = await BeneficiaryContext.findOne({ farmerId }).lean();
    if (ctx?.companyId) {
      const geo = lat && lng ? {
        latitude: Number(lat), longitude: Number(lng), capturedAt: new Date(),
        source: 'DEVICE', capturedByUserId: req.user?._id,
        capturedByName: req.user?.username || req.user?.name || req.user?.mobile || 'Agency surveyor',
        capturedByRole: req.user?.role || 'surveyor'
      } : undefined;
      let configured = await getStageRequirements({ companyId: ctx.companyId, programId: ctx.programId, stages: ['SURVEY'] });
      if (!configured.length) {
        const defaults = [
          { key: 'agency-beneficiary-photo', label: 'Beneficiary photo', evidenceType: 'PHOTO', sortOrder: 10 },
          { key: 'agency-site-survey-photos', label: 'Site survey photos', evidenceType: 'PHOTO', sortOrder: 20 },
          { key: 'agency-beneficiary-signature', label: 'Beneficiary signature', evidenceType: 'SIGNATURE', sortOrder: 30 },
        ];
        for (const row of defaults) {
          await EvidenceRequirement.findOneAndUpdate(
            { companyId: ctx.companyId, programId: ctx.programId || null, stage: 'SURVEY', key: row.key },
            { $setOnInsert: { ...row, required: true, minFiles: 1, isActive: true } },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          );
        }
      }
      await syncConfiguredEvidence({
        context: ctx,
        farmerId,
        user: req.user,
        stages: ['SURVEY'],
        geo,
        proofs: {
          beneficiaryPhoto: req.files?.farmerPhoto || [],
          sitePhotos: req.files?.sitePhotos || [],
          beneficiarySignature: req.files?.signature || [],
        },
        notes: `Submitted from Agency field verification by ${req.user?.username || req.user?.name || req.user?.mobile || 'surveyor'}.`,
      });

      if (inspectionStatus === 'Completed') {
        const evidenceState = await requiredEvidenceState({ context: ctx, farmerId, stages: ['SURVEY'] });
        if (evidenceState.configured && evidenceState.missing.length) {
          await Farmer.updateOne({ _id: farmerId }, { $set: { inspectionStatus: 'In Progress' } });
          updatedFarmer.inspectionStatus = 'In Progress';
          return res.status(409).json({
            message: `Survey draft is saved, but ${evidenceState.missing.length} Company evidence requirement(s) are still pending. Complete the checklist before marking the survey complete.`,
            code: 'SURVEY_EVIDENCE_PENDING',
            missingEvidence: evidenceState.missing.map(x => ({ id: x._id, label: x.label, type: x.evidenceType, minFiles: x.minFiles })),
            farmer: updatedFarmer,
          });
        }
      }
    }

    if (ctx?.companyId) {
      await publishAgencyProgress({
        req, farmer: updatedFarmer, context: ctx, action: 'AGENCY_SURVEY_SUBMITTED',
        title: `Survey submitted · ${updatedFarmer.beneficiaryId || updatedFarmer.beneficiaryName || 'Beneficiary'}`,
        message: `${req.user?.username || 'Agency technician'} submitted field verification (${inspectionStatus || 'Pending'}).`,
        type: inspectionStatus === 'Completed' ? 'SUCCESS' : 'INFO',
        after: { inspectionStatus, surveyDate: updatedFarmer.surveyDate, siteLocation: updatedFarmer.siteLocation }
      });
    }

    return res.json({
      message: 'Field verification submitted successfully.',
      farmer: updatedFarmer
    });
  } catch (err) {
    console.error('Error in field verification:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};
