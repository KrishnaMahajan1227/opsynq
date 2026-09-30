const mongoose=require('mongoose');
const schema=new mongoose.Schema({
 companyId:{type:mongoose.Schema.Types.ObjectId,ref:'Organization',required:true,index:true},providerId:{type:mongoose.Schema.Types.ObjectId,ref:'RmsProvider',required:true,index:true},deviceId:{type:mongoose.Schema.Types.ObjectId,ref:'RmsDevice',required:true,index:true},agencyId:{type:mongoose.Schema.Types.ObjectId,ref:'Organization',index:true},farmerId:{type:mongoose.Schema.Types.ObjectId,ref:'Farmer',index:true},workPackageId:{type:mongoose.Schema.Types.ObjectId,ref:'WorkPackage',index:true},assignedTechnicianUserId:{type:mongoose.Schema.Types.ObjectId,ref:'User',index:true},
 type:{type:String,enum:['COMMUNICATION_LOST','DRY_RUN','CONTROLLER_FAULT','LOW_PERFORMANCE','LOCATION_MISMATCH','UNKNOWN_PROVIDER_FAULT'],required:true,index:true},severity:{type:String,enum:['INFO','WARNING','CRITICAL'],required:true,index:true},status:{type:String,enum:['ACTIVE','RESOLVED'],default:'ACTIVE',index:true},
 firstDetectedAt:{type:Date,required:true},lastDetectedAt:{type:Date,required:true},resolvedAt:Date,recoveryAt:Date,acknowledgedAt:Date,acknowledgedBy:{type:mongoose.Schema.Types.ObjectId,ref:'PlatformUser'},externalFaultCode:String,message:String,relatedServiceCaseId:{type:mongoose.Schema.Types.ObjectId,ref:'ServiceCase'}
},{timestamps:true});
schema.index({companyId:1,status:1,severity:1,createdAt:-1});
schema.index({deviceId:1,type:1,status:1});
schema.index({companyId:1,agencyId:1,status:1,lastDetectedAt:-1});
schema.index({companyId:1,assignedTechnicianUserId:1,status:1,lastDetectedAt:-1});
module.exports=mongoose.model('RmsAlert',schema);
