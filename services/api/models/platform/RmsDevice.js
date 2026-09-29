const mongoose=require('mongoose');
const schema=new mongoose.Schema({
 companyId:{type:mongoose.Schema.Types.ObjectId,ref:'Organization',required:true,index:true},providerId:{type:mongoose.Schema.Types.ObjectId,ref:'RmsProvider',required:true,index:true},
 agencyId:{type:mongoose.Schema.Types.ObjectId,ref:'Organization',index:true},programId:{type:mongoose.Schema.Types.ObjectId,ref:'Program',index:true},workOrderId:{type:mongoose.Schema.Types.ObjectId,ref:'WorkOrder',index:true},workPackageId:{type:mongoose.Schema.Types.ObjectId,ref:'WorkPackage',index:true},
 farmerId:{type:mongoose.Schema.Types.ObjectId,ref:'Farmer',index:true},installedAssetId:{type:mongoose.Schema.Types.ObjectId,ref:'InstalledAsset',index:true},
 externalDeviceId:{type:String,required:true,trim:true},serialNumber:String,imei:String,iccid:String,make:String,model:String,firmware:String,
 mappingStatus:{type:String,enum:['MAPPED','UNMAPPED','CONFLICT','NEEDS_REVIEW'],default:'UNMAPPED',index:true},
 lifecycleStatus:{type:String,enum:['UNMAPPED','ALLOCATED','INSTALLED','COMMISSIONING','COMMISSIONED','REPLACED','DECOMMISSIONED'],default:'UNMAPPED',index:true},
 commissioningStatus:{type:String,enum:['NOT_STARTED','PENDING','READY','COMMISSIONED','FAILED'],default:'NOT_STARTED',index:true},
 installedAt:Date,commissionedAt:Date,lastSeenAt:Date,lastTelemetryAt:Date,
 installedLocation:{latitude:Number,longitude:Number},reportedLocation:{latitude:Number,longitude:Number},
 capabilities:{type:[String],default:[]},metadata:{type:mongoose.Schema.Types.Mixed,default:{}}
},{timestamps:true});
schema.index({companyId:1,providerId:1,externalDeviceId:1},{unique:true});
schema.index({companyId:1,agencyId:1,mappingStatus:1});
schema.index({companyId:1,farmerId:1});
module.exports=mongoose.model('RmsDevice',schema);
