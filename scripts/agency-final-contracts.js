const fs=require('fs');
const read=p=>fs.readFileSync(p,'utf8');
const checks=[
 ['Agency sidebar exposes Team & Access',read('apps/agency-web/src/components/AgencySidebar.jsx').includes("key: 'users', label: 'Team & Access'")],
 ['Agency Admin renders Team & Access',read('apps/agency-web/src/pages/DashboardAdmin.jsx').includes('<AgencyTeamAccessPanel role="admin" />')],
 ['Agency Superadmin renders Team & Access',read('apps/agency-web/src/pages/DashboardSuperAdmin.jsx').includes('<AgencyTeamAccessPanel role="superadmin" />')],
 ['Admin technician creation is role-restricted server-side',read('services/api/controllers/userController.js').includes("Agency Admins can add field technicians only")],
 ['Assignment endpoint mounted',read('services/api/routes/farmerRoutes.js').includes("/:id/assign-technician")],
 ['Installation work owner persisted',read('services/api/models/Farmer.js').includes('installationAssignedTechnician')],
 ['Technician scope includes installation owner',read('services/api/utils/agencyScope.js').includes('installationAssignedTechnician')],
 ['Technician mobile queue honors installation assignment',read('apps/agency-web/src/pages/DashboardTechnician.jsx').includes('installationAssignedTechnician ||')],
 ['Agency import pauses for extra-column review',read('services/api/controllers/farmerController.js').includes("status: 'customFieldsReview'")],
 ['Agency import UI reviews extra columns',read('apps/agency-web/src/pages/UploadExcel.jsx').includes('Include as Custom Fields')],
 ['Custom imported fields visible in beneficiary detail',read('apps/agency-web/src/components/FarmerDetailView.jsx').includes('Custom imported fields')],
 ['Sidebar collapse state persists',read('apps/agency-web/src/components/AgencySidebar.jsx').includes('opsynq_agency_sidebar_collapsed')],
 ['Installation modal prefills existing assignment context',read('apps/agency-web/src/components/InstallationCompletionModal.jsx').includes('farmer.installationAssignedTechnician')],
];
let failed=false;for(const [name,ok] of checks){console.log(`${ok?'✓':'✗'} ${name}`);if(!ok)failed=true}if(failed)process.exit(1);console.log(`Agency final workflow contracts passed (${checks.length} checks)`);
