const router=require('express').Router();
const c=require('../controllers/agencyInventoryController');
const {protect}=require('../middleware/authMiddleware');
const {authorizeRoles}=require('../middleware/roleMiddleware');
router.use(protect,authorizeRoles('admin','superadmin'));
router.get('/shipments',c.listInbound);
router.post('/shipments/:id/receive',c.receive);
module.exports=router;
