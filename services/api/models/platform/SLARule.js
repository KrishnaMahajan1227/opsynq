const mongoose=require('mongoose');
const schema=new mongoose.Schema({
 companyId:{type:mongoose.Schema.Types.ObjectId,ref:'Organization',required:true,index:true},
 programId:{type:mongoose.Schema.Types.ObjectId,ref:'Program',index:true},
 name:{type:String,required:true},
 appliesTo:{type:String,enum:['SERVICE_CASE','SURVEY','INSTALLATION','FINAL_INSPECTION','CLAIM'],required:true,index:true},
 caseType:{type:String},priority:{type:String},
 targetHours:{type:Number,required:true,min:1},warningHours:{type:Number,min:0,default:4},
 isActive:{type:Boolean,default:true,index:true},
 createdBy:{type:mongoose.Schema.Types.ObjectId,ref:'PlatformUser'}
},{timestamps:true});
schema.index({companyId:1,appliesTo:1,isActive:1});
module.exports=mongoose.model('SLARule',schema);
