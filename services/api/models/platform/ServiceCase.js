const mongoose=require('mongoose');
const schema=new mongoose.Schema({
 companyId:{type:mongoose.Schema.Types.ObjectId,ref:'Organization',required:true,index:true},
 agencyId:{type:mongoose.Schema.Types.ObjectId,ref:'Organization',index:true},
 farmerId:{type:mongoose.Schema.Types.ObjectId,ref:'Farmer',index:true},
 installedAssetId:{type:mongoose.Schema.Types.ObjectId,ref:'InstalledAsset',index:true},
 caseNo:{type:String,required:true,index:true},
 type:{type:String,enum:['COMPLAINT','WARRANTY','AMC','PREVENTIVE_MAINTENANCE','BREAKDOWN'],default:'COMPLAINT',index:true},
 priority:{type:String,enum:['LOW','MEDIUM','HIGH','CRITICAL'],default:'MEDIUM',index:true},
 status:{type:String,enum:['OPEN','ASSIGNED','IN_PROGRESS','WAITING_PART','RESOLVED','CLOSED','CANCELLED'],default:'OPEN',index:true},
 title:{type:String,required:true},description:String,
 source:{type:String,enum:['COMPANY','AGENCY','TECHNICIAN','BENEFICIARY','SYSTEM','LEGACY_COMPLAINT'],default:'COMPANY'},
 assignedToPlatformUser:{type:mongoose.Schema.Types.ObjectId,ref:'PlatformUser'},
 assignedToLegacyUser:{type:mongoose.Schema.Types.ObjectId,ref:'User'},
 openedAt:{type:Date,default:Date.now},dueAt:Date,firstResponseAt:Date,resolvedAt:Date,closedAt:Date,
 slaState:{type:String,enum:['ON_TRACK','DUE_SOON','BREACHED','NOT_APPLICABLE'],default:'NOT_APPLICABLE',index:true},
 resolution:String,
 evidence:{type:mongoose.Schema.Types.Mixed,default:{}},
 metadata:{type:mongoose.Schema.Types.Mixed,default:{}}
},{timestamps:true});
schema.index({companyId:1,status:1,dueAt:1});
schema.index({companyId:1,caseNo:1},{unique:true});
module.exports=mongoose.model('ServiceCase',schema);
