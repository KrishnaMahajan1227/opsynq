const router=require('express').Router();
const c=require('../../controllers/platform/readinessController');
const {protectPlatform,requirePlatformRoles,requireCompanyScope}=require('../../middleware/platform/platformAuth');
const {rolesFor}=require('../../security/platformCapabilities');
router.use(protectPlatform,requireCompanyScope);
router.get('/company',requirePlatformRoles(...rolesFor('readiness.read')),c.companyReadiness);
module.exports=router;
