const mongoose=require('mongoose');
const schema=new mongoose.Schema({scopeKey:{type:String,required:true,unique:true,index:true},revision:{type:Number,default:0}},{timestamps:true});
module.exports=mongoose.model('RealtimeRevision',schema);
