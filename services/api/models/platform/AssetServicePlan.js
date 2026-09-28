const mongoose=require('mongoose');
const schema=new mongoose.Schema({
 companyId:{type:mongoose.Schema.Types.ObjectId,ref:'Organization',required:true,index:true},
 installedAssetId:{type:mongoose.Schema.Types.ObjectId,ref:'InstalledAsset',required:true,index:true},
 planType:{type:String,enum:['WARRANTY','AMC'],required:true,index:true},provider:String,referenceNo:String,
 startDate:{type:Date,required:true},endDate:{type:Date,required:true,index:true},
 status:{type:String,enum:['ACTIVE','EXPIRING','EXPIRED','CANCELLED'],default:'ACTIVE',index:true},
 coverage:String,terms:String,metadata:{type:mongoose.Schema.Types.Mixed,default:{}}
},{timestamps:true});
schema.index({companyId:1,installedAssetId:1,planType:1});
module.exports=mongoose.model('AssetServicePlan',schema);
