const mongoose=require('mongoose');
const COMPANY_ROLES=['company_owner','company_admin','operations_manager','program_manager','inventory_manager','procurement_manager','finance_user','quality_user','logistics_manager','viewer'];
const readSchema=new mongoose.Schema({userId:{type:mongoose.Schema.Types.ObjectId,ref:'PlatformUser',required:true},readAt:{type:Date,default:Date.now}},{_id:false});
const schema=new mongoose.Schema({
 companyId:{type:mongoose.Schema.Types.ObjectId,ref:'Organization',index:true},
 recipientUserId:{type:mongoose.Schema.Types.ObjectId,ref:'PlatformUser',index:true},
 recipientRoles:{type:[String],enum:COMPANY_ROLES,default:[],index:true},
 type:{type:String,enum:['INFO','ACTION','WARNING','CRITICAL','SUCCESS'],default:'INFO',index:true},
 title:{type:String,required:true},message:{type:String,required:true},
 entityType:String,entityId:mongoose.Schema.Types.ObjectId,actionUrl:String,
 isRead:{type:Boolean,default:false,index:true},readAt:Date,
 readBy:{type:[readSchema],default:[]},
 createdBy:{type:mongoose.Schema.Types.ObjectId,ref:'PlatformUser'}
},{timestamps:true});
schema.index({companyId:1,recipientUserId:1,isRead:1,createdAt:-1});
schema.index({companyId:1,recipientRoles:1,createdAt:-1});
module.exports=mongoose.model('Notification',schema);
