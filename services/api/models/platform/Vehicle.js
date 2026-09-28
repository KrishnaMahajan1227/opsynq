const mongoose=require('mongoose');
const schema=new mongoose.Schema({
  companyId:{type:mongoose.Schema.Types.ObjectId,ref:'Organization',required:true,index:true},
  registrationNo:{type:String,required:true},type:String,capacity:String,
  status:{type:String,enum:['AVAILABLE','ASSIGNED','MAINTENANCE','INACTIVE'],default:'AVAILABLE',index:true},
  baseLocation:String,notes:String,metadata:{type:mongoose.Schema.Types.Mixed,default:{}},isActive:{type:Boolean,default:true}
},{timestamps:true});
schema.index({companyId:1,registrationNo:1},{unique:true});
schema.index({companyId:1,status:1,isActive:1,registrationNo:1});
module.exports=mongoose.model('Vehicle',schema);
