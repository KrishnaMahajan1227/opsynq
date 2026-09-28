const mongoose=require('mongoose');
const schema=new mongoose.Schema({
 companyId:{type:mongoose.Schema.Types.ObjectId,ref:'Organization',required:true,index:true},
 agencyId:{type:mongoose.Schema.Types.ObjectId,ref:'Organization',required:true,index:true},
 legacyUserId:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true,index:true},
 role:{type:String,enum:['field_technician','admin','superadmin'],required:true},
 isActive:{type:Boolean,default:true},linkedBy:{type:mongoose.Schema.Types.ObjectId,ref:'PlatformUser'}
},{timestamps:true});
schema.index({companyId:1,agencyId:1,legacyUserId:1},{unique:true});
module.exports=mongoose.model('AgencyUserLink',schema);
