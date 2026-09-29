const mongoose=require('mongoose');
const schema=new mongoose.Schema({
 companyId:{type:mongoose.Schema.Types.ObjectId,ref:'Organization',required:true,index:true},
 name:{type:String,required:true,trim:true},code:{type:String,required:true,trim:true,uppercase:true},
 type:{type:String,enum:['DEMO_SIMULATOR','REST_API','MQTT','WEBHOOK','CUSTOM'],required:true,index:true},
 transport:{type:String,enum:['SIMULATED','REST','MQTT','WEBHOOK','CUSTOM'],required:true},
 mode:{type:String,enum:['SIMULATED','LIVE'],default:'SIMULATED',index:true},status:{type:String,enum:['ACTIVE','INACTIVE','DEGRADED','DOWN'],default:'ACTIVE',index:true},
 capabilities:{type:[String],default:[]},mappingVersion:{type:String,default:'v1'},configuration:{type:mongoose.Schema.Types.Mixed,default:{}},
 lastSuccessfulSync:Date,lastFailedSync:Date,lastDataReceived:Date,lastError:String
},{timestamps:true});
schema.index({companyId:1,code:1},{unique:true});
module.exports=mongoose.model('RmsProvider',schema);
