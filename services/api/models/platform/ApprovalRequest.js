const mongoose=require('mongoose');
const schema=new mongoose.Schema({
 companyId:{type:mongoose.Schema.Types.ObjectId,ref:'Organization',required:true,index:true},requestNo:{type:String,required:true,index:true},
 type:{type:String,enum:['WORK_PACKAGE_CHANGE','INVENTORY_ADJUSTMENT','SERIAL_OVERRIDE','CLAIM_EXCEPTION','COMPLIANCE_WAIVER','SERVICE_EXCEPTION','PURCHASE_ORDER_APPROVAL','OTHER'],default:'OTHER',index:true},
 title:{type:String,required:true},description:String,entityType:String,entityId:mongoose.Schema.Types.ObjectId,
 requestedBy:{type:mongoose.Schema.Types.ObjectId,ref:'PlatformUser',required:true},status:{type:String,enum:['PENDING','APPROVED','REJECTED','CANCELLED'],default:'PENDING',index:true},
 decidedBy:{type:mongoose.Schema.Types.ObjectId,ref:'PlatformUser'},decidedAt:Date,decisionReason:String,payload:{type:mongoose.Schema.Types.Mixed,default:{}}
},{timestamps:true});
schema.index({companyId:1,requestNo:1},{unique:true});schema.index({companyId:1,status:1,createdAt:-1});
module.exports=mongoose.model('ApprovalRequest',schema);
