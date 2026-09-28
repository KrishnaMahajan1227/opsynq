const mongoose=require('mongoose');
const schema=new mongoose.Schema({
 companyId:{type:mongoose.Schema.Types.ObjectId,ref:'Organization',required:true,index:true},
 programId:{type:mongoose.Schema.Types.ObjectId,ref:'Program',required:true,index:true},
 contractId:{type:mongoose.Schema.Types.ObjectId,ref:'Contract',index:true},
 workOrderId:{type:mongoose.Schema.Types.ObjectId,ref:'WorkOrder',index:true},
 workPackageId:{type:mongoose.Schema.Types.ObjectId,ref:'WorkPackage',index:true},
 claimNo:{type:String,required:true,index:true},title:{type:String,required:true},
 status:{type:String,enum:['DRAFT','READY','SUBMITTED','UNDER_REVIEW','APPROVED','PARTIALLY_APPROVED','REJECTED','PAID','CANCELLED'],default:'DRAFT',index:true},
 currency:{type:String,default:'INR'},grossAmount:{type:Number,default:0},eligibleAmount:{type:Number,default:0},approvedAmount:{type:Number,default:0},paidAmount:{type:Number,default:0},
 blockedAmount:{type:Number,default:0},blockedReason:String,
 beneficiaryCount:{type:Number,default:0},
 readyAt:Date,submittedAt:Date,approvedAt:Date,paidAt:Date,
 dueAt:Date,slaState:{type:String,enum:['ON_TRACK','DUE_SOON','BREACHED','NOT_APPLICABLE'],default:'NOT_APPLICABLE'},
 notes:String,metadata:{type:mongoose.Schema.Types.Mixed,default:{}}
},{timestamps:true});
schema.index({companyId:1,status:1,createdAt:-1});
schema.index({companyId:1,claimNo:1},{unique:true});
module.exports=mongoose.model('CommercialClaim',schema);
