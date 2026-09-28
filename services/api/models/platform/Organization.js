const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  name:{type:String,required:true,trim:true}, code:{type:String,required:true,unique:true,uppercase:true,trim:true},
  type:{type:String,enum:['PLATFORM','COMPANY','AGENCY','SUPPLIER','OEM','WAREHOUSE_OPERATOR','INSPECTION_PARTNER','LOGISTICS_PARTNER'],required:true},
  parentOrganization:{type:mongoose.Schema.Types.ObjectId,ref:'Organization',default:null}, country:{type:String,default:'India'}, state:String,
  status:{type:String,enum:['PENDING','ACTIVE','SUSPENDED','ARCHIVED'],default:'PENDING'}, contact:{name:String,email:String,mobile:String},
  address:{line1:String,line2:String,city:String,district:String,state:String,country:String,pincode:String}, metadata:{type:mongoose.Schema.Types.Mixed,default:{}}
},{timestamps:true});
schema.index({type:1,status:1}); schema.index({parentOrganization:1});
module.exports=mongoose.model('Organization',schema);
