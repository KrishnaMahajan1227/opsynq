const mongoose=require('mongoose');
const schema=new mongoose.Schema({companyId:{type:mongoose.Schema.Types.ObjectId,ref:'Organization',required:true,index:true},registrationNo:{type:String,required:true},type:String,capacity:String,isActive:{type:Boolean,default:true}},{timestamps:true}); schema.index({companyId:1,registrationNo:1},{unique:true}); module.exports=mongoose.model('Vehicle',schema);
