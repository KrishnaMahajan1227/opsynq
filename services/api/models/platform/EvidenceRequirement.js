const mongoose=require('mongoose');
const schema=new mongoose.Schema({
 companyId:{type:mongoose.Schema.Types.ObjectId,ref:'Organization',required:true,index:true},programId:{type:mongoose.Schema.Types.ObjectId,ref:'Program',default:null,index:true},
 stage:{type:String,enum:['SURVEY','INSTALLATION','FINAL_INSPECTION'],required:true,index:true},key:{type:String,required:true},label:{type:String,required:true},
 evidenceType:{type:String,enum:['PHOTO','DOCUMENT','SIGNATURE','BOOLEAN','TEXT'],default:'PHOTO'},required:{type:Boolean,default:true},minFiles:{type:Number,default:1,min:0},sortOrder:{type:Number,default:0},isActive:{type:Boolean,default:true}
},{timestamps:true});
schema.index({companyId:1,programId:1,stage:1,key:1},{unique:true});
module.exports=mongoose.model('EvidenceRequirement',schema);
