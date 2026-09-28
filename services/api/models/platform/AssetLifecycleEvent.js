const mongoose=require('mongoose');
const schema=new mongoose.Schema({
 companyId:{type:mongoose.Schema.Types.ObjectId,ref:'Organization',required:true,index:true},agencyId:{type:mongoose.Schema.Types.ObjectId,ref:'Organization',index:true},
 farmerId:{type:mongoose.Schema.Types.ObjectId,ref:'Farmer',required:true,index:true},installedAssetId:{type:mongoose.Schema.Types.ObjectId,ref:'InstalledAsset',index:true},
 inventorySerialId:{type:mongoose.Schema.Types.ObjectId,ref:'InventorySerial',index:true},
 eventType:{type:String,enum:['INSTALLED','RETURNED','DAMAGED','REPLACED','REMOVED','SERVICE_OPENED','SERVICE_CLOSED'],required:true,index:true},
 reason:String,notes:String,performedByPlatformUser:{type:mongoose.Schema.Types.ObjectId,ref:'PlatformUser'},performedByLegacyUser:{type:mongoose.Schema.Types.ObjectId,ref:'User'},
 evidence:{type:mongoose.Schema.Types.Mixed,default:{}},occurredAt:{type:Date,default:Date.now}
},{timestamps:true});
schema.index({companyId:1,farmerId:1,occurredAt:-1});
module.exports=mongoose.model('AssetLifecycleEvent',schema);
