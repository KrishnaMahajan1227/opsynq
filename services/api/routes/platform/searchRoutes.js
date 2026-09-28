const router=require('express').Router();
const c=require('../../controllers/platform/searchController');
const {protectPlatform,requirePlatformRoles,requireCompanyScope}=require('../../middleware/platform/platformAuth');
const {rolesFor}=require('../../security/platformCapabilities');
const roles=rolesFor('company.read');
router.use(protectPlatform,requireCompanyScope);
router.get('/',requirePlatformRoles(...roles),c.search);
module.exports=router;
