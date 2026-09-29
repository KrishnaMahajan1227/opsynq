const mongoose=require('mongoose');
const schema=new mongoose.Schema({
 companyId:{type:mongoose.Schema.Types.ObjectId,ref:'Organization',required:true,index:true},deviceId:{type:mongoose.Schema.Types.ObjectId,ref:'RmsDevice',required:true,unique:true,index:true},agencyId:{type:mongoose.Schema.Types.ObjectId,ref:'Organization',index:true},farmerId:{type:mongoose.Schema.Types.ObjectId,ref:'Farmer',index:true},
 telemetryAt:{type:Date,required:true},receivedAt:{type:Date,required:true},
 communication:{type:String,enum:['ONLINE','OFFLINE','STALE','UNKNOWN'],default:'UNKNOWN',index:true},health:{type:String,enum:['HEALTHY','WARNING','CRITICAL','UNKNOWN'],default:'UNKNOWN',index:true},pumpState:{type:String,enum:['RUNNING','STOPPED','UNKNOWN'],default:'UNKNOWN',index:true},
 dcVoltage:Number,dcCurrent:Number,powerKw:Number,energyTodayKwh:Number,runtimeTodayMinutes:Number,waterFlowLpm:Number,waterDischargeLitres:Number,signalQuality:Number,
 normalizedFault:String,externalFaultCode:String,latitude:Number,longitude:Number,lastHealthyAt:Date,
 unsupported:{type:[String],default:[]},optional:{type:mongoose.Schema.Types.Mixed,default:{}}
},{timestamps:true});
schema.index({companyId:1,communication:1,health:1});
module.exports=mongoose.model('RmsCurrentState',schema);
