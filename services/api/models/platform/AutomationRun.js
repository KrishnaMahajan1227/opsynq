const mongoose=require('mongoose');
const schema=new mongoose.Schema({
 companyId:{type:mongoose.Schema.Types.ObjectId,ref:'Organization',index:true},
 job:{type:String,required:true,index:true},
 trigger:{type:String,enum:['SCHEDULED','MANUAL','SYSTEM','INTELLIGENCE_SCAN'],default:'SYSTEM',index:true},
 status:{type:String,enum:['RUNNING','COMPLETED','FAILED','SKIPPED'],default:'RUNNING',index:true},
 startedAt:{type:Date,default:Date.now,index:true},completedAt:Date,
 metrics:{type:mongoose.Schema.Types.Mixed,default:{}},
 errors:{type:[String],default:[]},
 requestedBy:{type:mongoose.Schema.Types.ObjectId,ref:'PlatformUser'},
 host:String
},{timestamps:true});
schema.index({companyId:1,job:1,startedAt:-1});
module.exports=mongoose.model('AutomationRun',schema);
