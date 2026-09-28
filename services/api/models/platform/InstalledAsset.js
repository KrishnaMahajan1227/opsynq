const mongoose=require('mongoose');
const schema=new mongoose.Schema({
 companyId:{type:mongoose.Schema.Types.ObjectId,ref:'Organization',required:true,index:true},
 agencyId:{type:mongoose.Schema.Types.ObjectId,ref:'Organization',required:true,index:true},
 farmerId:{type:mongoose.Schema.Types.ObjectId,ref:'Farmer',required:true,index:true},
 workPackageId:{type:mongoose.Schema.Types.ObjectId,ref:'WorkPackage',index:true},
 technicianUserId:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true,index:true},
 itemId:{type:mongoose.Schema.Types.ObjectId,ref:'ItemMaster',required:true,index:true},
 inventorySerialId:{type:mongoose.Schema.Types.ObjectId,ref:'InventorySerial',required:true,index:true},
 serialNumber:{type:String,required:true},barcodeValue:String,
 assetRole:{type:String,enum:['PUMP','MOTOR','CONTROLLER','PANEL','OTHER'],default:'OTHER',index:true},
 status:{type:String,enum:['ACTIVE','REPLACED','REMOVED','RETURNED','DAMAGED'],default:'ACTIVE',index:true},
 installedAt:{type:Date,default:Date.now},removedAt:Date,
 warrantyStart:Date,warrantyEnd:Date,
 replacementAssetId:{type:mongoose.Schema.Types.ObjectId,ref:'InstalledAsset'},
 notes:String,metadata:{type:mongoose.Schema.Types.Mixed,default:{}}
},{timestamps:true});
schema.index({companyId:1,farmerId:1,status:1});
schema.index({companyId:1,inventorySerialId:1},{unique:true});
module.exports=mongoose.model('InstalledAsset',schema);
