const mongoose=require('mongoose');
const schema=new mongoose.Schema({
 companyId:{type:mongoose.Schema.Types.ObjectId,ref:'Organization',required:true,index:true},providerId:{type:mongoose.Schema.Types.ObjectId,ref:'RmsProvider',required:true,index:true},externalDeviceId:{type:String,index:true},messageKey:String,providerTimestamp:Date,receivedAt:{type:Date,default:Date.now,index:true},mappingVersion:String,status:{type:String,enum:['RECEIVED','PROCESSED','DUPLICATE','FAILED','UNMAPPED'],default:'RECEIVED',index:true},processingError:String,payload:{type:mongoose.Schema.Types.Mixed,default:{}}
},{timestamps:true});
schema.index({providerId:1,messageKey:1},{sparse:true});
module.exports=mongoose.model('RmsRawIngestion',schema);
