// src/controllers/installationController.js
const multer = require('multer');
const { storage } = require('../config/cloudinary');
const upload = multer({ storage });
const Farmer = require('../models/Farmer');
const { protect } = require('../middleware/authMiddleware');
const { getIssuedInventory, prepareInstallation, finalizeInstallation } = require('../utils/assetLifecycle');
const { canAccessFarmer } = require('../utils/agencyScope');

/**
 * completeInstallation
 *
 * Handles final installation submission:
 *  - Saves pump/motor/controller/IMEI unique IDs
 *  - Saves panel serials as a dynamic array (minimum 1 panel, no maximum limit)
 *  - Marks installation done or raises a complaint
 *  - Records complaint details and who raised them
 *  - Uploads final photos and signatures to Cloudinary
 *  - Updates applicationStatus to "Installation Completed" (if successful) or "Complaint Raised"
 *  - For rework: If installation completes successfully, clears rework-related fields
 *  - Saves the technician who completed the installation
 */
exports.completeInstallation = [
  protect,
  upload.fields([
    { name: 'finalFarmerPhoto', maxCount: 1 },
    { name: 'finalSitePhotos', maxCount: 20 },
    { name: 'finalSignature', maxCount: 1 },
    { name: 'finalSurveyorSignature', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      // Destructure text fields
      const {
        farmerId,
        pumpNoUnique,
        motorNoUnique,
        controllerNoUnique,
        imeiNoUnique,
        panels, // Array of panel serial numbers
        installationDoneYesNo,
        pumpNotOperatingYesNo,
        complaintIssue,
        complaintRaisedDate,
        complaintNumber,
        companyAssignedPersonName,
      } = req.body;

      // Validate required fields
      if (!farmerId) {
        console.log('Validation failed: farmerId missing');
        return res.status(400).json({ message: 'Farmer ID is required.' });
      }

      if (!pumpNoUnique || !motorNoUnique || !controllerNoUnique || !imeiNoUnique) {
        console.log('Validation failed: Unique IDs missing');
        return res.status(400).json({ message: 'All unique IDs (Pump, Motor, Controller, IMEI) are required.' });
      }

      if (!installationDoneYesNo || !pumpNotOperatingYesNo || !companyAssignedPersonName) {
        console.log('Validation failed: Installation fields missing');
        return res.status(400).json({ message: 'All installation fields are required.' });
      }

      // Validate panels array (required, must have at least 1 entry, no maximum limit)
      let panelsArray = [];
      if (!panels) {
        console.log('Validation failed: Panels missing');
        return res.status(400).json({ message: 'At least one panel serial number is required.' });
      }
      panelsArray = Array.isArray(panels) ? panels : JSON.parse(panels); // Handle if panels is sent as a JSON string
      if (!Array.isArray(panelsArray) || panelsArray.length < 1) {
        console.log('Validation failed: At least one panel required');
        return res.status(400).json({ message: 'At least one panel serial number is required.' });
      }

      // Validate complaint fields if pump is not operating
      const hasComplaint = pumpNotOperatingYesNo === 'No';
      if (hasComplaint && (!complaintIssue || !complaintRaisedDate || !complaintNumber)) {
        console.log('Validation failed: Complaint fields missing', {
          complaintIssue,
          complaintRaisedDate,
          complaintNumber,
        });
        return res.status(400).json({ message: 'All complaint fields (issue, date, number) are required when pump is not operating.' });
      }

      // Identify who raised the complaint and who completed the installation
      const raisedByName = req.user?.name || 'Unknown';
      const raisedById = req.user?._id?.toString() || 'Unknown';
      const completedByTechnician = req.user?.username || 'Unknown'; // Technician's username

      // Fetch the farmer document to check if this is a rework scenario
      const farmer = await Farmer.findById(farmerId);
      if (!farmer) return res.status(404).json({ message: 'Farmer not found.' });
      if (!(await canAccessFarmer(req.user, farmer))) return res.status(403).json({ message: 'You do not have access to this beneficiary.' });

      // Opsynq Phase 5: for company/work-package linked farmers, verify that
      // serialized hardware belongs to the logged-in technician before updating
      // the legacy Farmer record. Unlinked legacy farmers keep the proven flow.
      let inventoryPrepared = { linked: false };
      try {
        inventoryPrepared = await prepareInstallation({
          farmerId,
          technicianUserId: req.user._id,
          pump: pumpNoUnique,
          motor: motorNoUnique,
          controller: controllerNoUnique,
          panels: panelsArray,
        });
      } catch (inventoryError) {
        return res.status(inventoryError.statusCode || 409).json({ message: inventoryError.message });
      }

      // Determine new applicationStatus and complaintStatus
      const isRework = farmer.applicationStatus === 'Complaint Raised';
      const applicationStatus = hasComplaint ? 'Complaint Raised' : 'Installation Completed';
      const complaintStatus = hasComplaint ? 'Open' : '';

      // Prepare the update object with all fields
      const updateData = {
        pumpNoUnique: inventoryPrepared.canonical?.pump || pumpNoUnique || '',
        motorNoUnique: inventoryPrepared.canonical?.motor || motorNoUnique || '',
        controllerNoUnique: inventoryPrepared.canonical?.controller || controllerNoUnique || '',
        imeiNoUnique: imeiNoUnique || '',
        panels: inventoryPrepared.canonical?.panels?.length ? inventoryPrepared.canonical.panels : panelsArray, // Save canonical inventory serials when linked
        installationDoneYesNo: installationDoneYesNo || '',
        pumpNotOperatingYesNo: pumpNotOperatingYesNo || '',
        companyAssignedPersonName: companyAssignedPersonName || '',
        installationCompletionDate: new Date(), // Current date: May 23, 2025, 05:16 PM IST
        applicationStatus,
        installedByTechnicianName: completedByTechnician, // Save the technician who completed the installation
      };

      // If this is a rework and installation is successful (no new complaint), clear rework fields
      if (isRework && !hasComplaint) {
        updateData.reWork = '';
        updateData.issues = '';
        updateData.reworkAssignTechnician = '';
        updateData.reworkAssignDate = null;
        updateData.solutionDate = new Date(); // Set solutionDate to current date
      }

      // Add complaint fields if applicable
      if (hasComplaint) {
        updateData.complaintIssue = complaintIssue || '';
        updateData.complaintRaisedDate = complaintRaisedDate ? new Date(complaintRaisedDate) : new Date();
        updateData.complaintNumber = complaintNumber || '';
        updateData.complaintRaisedByName = raisedByName;
        updateData.complaintRaisedById = raisedById;
        updateData.complaintStatus = complaintStatus;
      } else {
        // Clear complaint fields if no complaint
        updateData.complaintIssue = '';
        updateData.complaintRaisedDate = null;
        updateData.complaintNumber = '';
        updateData.complaintRaisedByName = '';
        updateData.complaintRaisedById = '';
        updateData.complaintStatus = '';
      }

      // Handle uploaded files
      if (req.files?.finalFarmerPhoto) {
        console.log('Updating finalFarmerPhotoUrl:', req.files.finalFarmerPhoto[0].path);
        updateData.finalfarmerPhotoUrl = req.files.finalFarmerPhoto[0].path;
      }
      if (req.files?.finalSitePhotos) {
        console.log('Updating finalsitePhotosUrls:', req.files.finalSitePhotos.map(f => f.path));
        updateData.finalsitePhotosUrls = req.files.finalSitePhotos.map(f => f.path);
      }
      if (req.files?.finalSignature) {
        console.log('Updating finalsignatureUrl:', req.files.finalSignature[0].path);
        updateData.finalsignatureUrl = req.files.finalSignature[0].path;
      }
      if (req.files?.finalSurveyorSignature) {
        console.log('Updating finalsurveyorsignatureUrl:', req.files.finalSurveyorSignature[0].path);
        updateData.finalsurveyorsignatureUrl = req.files.finalSurveyorSignature[0].path;
      }

      // Update the farmer document using updateOne
      await Farmer.updateOne(
        { _id: farmerId },
        { $set: updateData },
        { runValidators: true }
      );

      let installedAssets = [];
      if (!hasComplaint && installationDoneYesNo === 'Yes' && inventoryPrepared.linked) {
        try {
          installedAssets = await finalizeInstallation({ prepared: inventoryPrepared, farmerId, technicianUserId: req.user._id });
        } catch (inventoryError) {
          console.error('Inventory finalization failed:', inventoryError);
          return res.status(inventoryError.statusCode || 409).json({
            message: `Installation details were saved, but inventory closing failed: ${inventoryError.message}. Please contact an administrator before retrying.`
          });
        }
      }

      // Fetch the updated document to confirm
      const updatedFarmer = await Farmer.findById(farmerId);

      // Return updated record
      return res.json({
        message: 'Installation updated successfully.',
        updatedFarmer,
        inventoryLinked: inventoryPrepared.linked,
        installedAssets,
      });
    } catch (err) {
      console.error('Error in completeInstallation:', err.message, err.stack);
      return res.status(500).json({ message: 'Server error: ' + err.message });
    }
  },
];

exports.getMyIssuedMaterial = async (req, res) => {
  try {
    const farmer = await Farmer.findById(req.params.farmerId).select('_id beneficiaryId beneficiaryName surveyorName surveyorMobile jsrTechnician installedByTechnicianName reworkAssignTechnician confirmedBy');
    if (!farmer) return res.status(404).json({ message: 'Farmer not found.' });
    if (!(await canAccessFarmer(req.user, farmer))) return res.status(403).json({ message: 'You do not have access to this beneficiary.' });
    const data = await getIssuedInventory({ farmerId: farmer._id, technicianUserId: req.user._id });
    return res.json({ linked: data.linked, context: data.context ? { agencyId: data.context.agencyId, workPackageId: data.context.workPackageId } : null, items: data.serials || [] });
  } catch (err) {
    console.error('Issued material lookup failed:', err);
    return res.status(500).json({ message: 'Unable to load issued material.' });
  }
};
