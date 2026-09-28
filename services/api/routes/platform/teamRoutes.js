const router=require('express').Router();
const c=require('../../controllers/platform/teamController');
const {protectPlatform,requirePlatformRoles,requireCompanyScope}=require('../../middleware/platform/platformAuth');
const {rolesFor}=require('../../security/platformCapabilities');
router.use(protectPlatform,requireCompanyScope);
router.get('/',requirePlatformRoles(...rolesFor('team.read')),c.list);
router.post('/',requirePlatformRoles(...rolesFor('team.manage')),c.create);
router.patch('/:userId',requirePlatformRoles(...rolesFor('team.manage')),c.update);
module.exports=router;
