const mongoose=require('mongoose');
const schema=new mongoose.Schema({
  companyId:{type:mongoose.Schema.Types.ObjectId,ref:'Organization',required:true,index:true},
  name:{type:String,required:true},mobile:{type:String,required:true},email:String,licenseNumber:String,
  status:{type:String,enum:['AVAILABLE','ASSIGNED','OFF_DUTY','INACTIVE'],default:'AVAILABLE',index:true},
  baseLocation:String,notes:String,isActive:{type:Boolean,default:true},
  lastLocation:{latitude:Number,longitude:Number,accuracy:Number,capturedAt:Date,updatedAt:Date}
},{timestamps:true});
schema.index({companyId:1,mobile:1},{unique:true});
schema.index({companyId:1,status:1,isActive:1,name:1});
module.exports=mongoose.model('Driver',schema);
