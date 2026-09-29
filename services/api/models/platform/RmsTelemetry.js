const mongoose=require('mongoose');
const schema=new mongoose.Schema({
 companyId:{type:mongoose.Schema.Types.ObjectId,ref:'Organization',required:true,index:true},providerId:{type:mongoose.Schema.Types.ObjectId,ref:'RmsProvider',required:true,index:true},deviceId:{type:mongoose.Schema.Types.ObjectId,ref:'RmsDevice',required:true,index:true},agencyId:{type:mongoose.Schema.Types.ObjectId,ref:'Organization',index:true},farmerId:{type:mongoose.Schema.Types.ObjectId,ref:'Farmer',index:true},
 messageKey:{type:String,required:true},telemetryAt:{type:Date,required:true,index:true},receivedAt:{type:Date,required:true},
 pumpState:String,dcVoltage:Number,dcCurrent:Number,powerKw:Number,energyTodayKwh:Number,runtimeTodayMinutes:Number,waterFlowLpm:Number,waterDischargeLitres:Number,signalQuality:Number,normalizedFault:String,externalFaultCode:String,latitude:Number,longitude:Number,unsupported:{type:[String],default:[]},optional:{type:mongoose.Schema.Types.Mixed,default:{}}
},{timestamps:true});
schema.index({providerId:1,messageKey:1},{unique:true});
schema.index({deviceId:1,telemetryAt:-1});
module.exports=mongoose.model('RmsTelemetry',schema);
