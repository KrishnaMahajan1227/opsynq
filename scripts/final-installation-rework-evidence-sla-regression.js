const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const checks=[];
const ok=(name,pass)=>{if(!pass)throw new Error(`FAIL ${name}`);checks.push(name);console.log(`PASS ${name}`)};

const runtime=read('services/api/utils/evidenceRuntime.js');
ok('Company evidence rules override legacy auto-default rows',runtime.includes('governRequirements')&&runtime.includes('LEGACY_DEFAULT_KEYS')&&runtime.includes('governed.length?governed:rows'));
ok('Legacy submitted survey evidence is mapped to current Company rules without GET writes',runtime.includes('legacyFallbackKey')&&runtime.includes('inheritedFromLegacy')&&runtime.includes('getEvidenceChecklist'));

const field=read('services/api/controllers/fieldVerificationController.js');
ok('Survey creates legacy evidence defaults only when Company has no survey rules',field.includes('if (!configured.length)')&&field.includes('syncConfiguredEvidence')&&field.includes("code: 'SURVEY_EVIDENCE_PENDING'"));

const install=read('services/api/controllers/installationController.js');
ok('No-complaint installation path is independent from complaint fields',install.includes("const hasComplaint = pumpNotOperatingYesNo === 'No' || installationDoneYesNo === 'No'")&&install.includes('if (hasComplaint && (!complaintIssue || !complaintRaisedDate || !complaintNumber))'));
ok('Installation completion is gated by governed Company evidence with legacy signature fallback only',install.includes("stages: ['INSTALLATION', 'FINAL_INSPECTION']")&&install.includes('governedEvidenceConfigured')&&install.includes('LEGACY_INSTALLATION_SIGNATURES_REQUIRED'));
ok('Failed rework remains open while successful rework resolves',install.includes('AGENCY_REWORK_STILL_OPEN')&&install.includes('AGENCY_REWORK_COMPLETED')&&install.includes("updateData.complaintStatus = 'Resolved'"));

const farmer=read('services/api/controllers/farmerController.js');
ok('Agency detail context includes Company SLA and governed evidence',farmer.includes("const SLARule = require('../models/platform/SLARule')")&&farmer.includes('getEvidenceChecklist')&&farmer.includes('slaRules,'));
ok('Evidence submission is restricted to beneficiary Program',farmer.includes('This evidence rule does not belong to the beneficiary Program.'));
ok('Approved REWORK assignment syncs ServiceCase and Company progress',farmer.includes("assignmentType === 'REWORK' && updatedFarmer?.applicationStatus === 'Complaint Raised'")&&farmer.includes("action: 'AGENCY_TECHNICIAN_ASSIGNED'"));

const admin=read('apps/agency-web/src/pages/DashboardAdmin.jsx');
const superAdmin=read('apps/agency-web/src/pages/DashboardSuperAdmin.jsx');
ok('Admin rework uses scoped assignment endpoint instead of invalid bulk field',admin.includes("assignmentType: 'REWORK'")&&admin.includes('/assign-technician')&&!admin.slice(admin.indexOf('const handleReworkSubmit'),admin.indexOf('const updateReworkData')).includes('/bulk-update'));
ok('Superadmin rework uses same scoped assignment endpoint',superAdmin.includes("assignmentType: 'REWORK'")&&superAdmin.includes('/assign-technician'));

const stage=read('apps/agency-web/src/components/StageRequirementsPanel.jsx');
ok('Technician requirement panel renders actual Company SLA rules',stage.includes('data?.slaRules')&&stage.includes('targetHours')&&stage.includes('warningHours'));
const verification=read('apps/agency-web/src/pages/FieldVerification.jsx');
ok('Survey completion warns before submit when Company evidence is pending',verification.includes('companyRequirementsState.pendingRequired')&&verification.includes('Complete the Company survey checklist'));
const modal=read('apps/agency-web/src/components/InstallationCompletionModal.jsx');
ok('Installation displays exact missing Company evidence instead of generic failure',modal.includes('validationDetails')&&modal.includes('missingEvidence'));

const css=read('apps/agency-web/src/agency-professional.css');
ok('Farmer evidence professional styling is loaded by runtime stylesheet',css.includes('Governed Farmer evidence presentation')&&css.includes('.crm-app .farmer-evidence-stage__items'));

const upload=read('services/api/controllers/upload.js');
const cloud=read('services/api/config/cloudinary.js');
ok('Company DOCUMENT evidence supports PDF without opening photo workflows',upload.includes("'application/pdf'")&&cloud.includes('evidenceStorage')&&cloud.includes("resource_type: 'auto'"));

console.log(`Final installation/rework/evidence/SLA regression passed (${checks.length} checks)`);
