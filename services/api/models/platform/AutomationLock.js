const mongoose=require('mongoose');
const schema=new mongoose.Schema({key:{type:String,unique:true,required:true},owner:{type:String,required:true},expiresAt:{type:Date,required:true,index:true}},{timestamps:true});
module.exports=mongoose.model('AutomationLock',schema);
