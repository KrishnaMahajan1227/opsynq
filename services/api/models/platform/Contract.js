const mongoose=require('mongoose');
const schema=new mongoose.Schema({
 companyId:{type:mongoose.Schema.Types.ObjectId,ref:'Organization',required:true,index:true},
 programId:{type:mongoose.Schema.Types.ObjectId,ref:'Program',required:true,index:true},
 type:{type:String,enum:['CONTRACT','LOA','TENDER','FRAMEWORK','OTHER'],default:'LOA'},
 number:{type:String,required:true,trim:true}, title:{type:String,required:true,trim:true}, authority:String,
 sanctionedQuantity:{type:Number,default:0,min:0}, contractValue:{type:Number,default:0,min:0}, currency:{type:String,default:'INR'},
 awardDate:Date,startDate:Date,endDate:Date,
 status:{type:String,enum:['DRAFT','ACTIVE','ON_HOLD','COMPLETED','CLOSED'],default:'DRAFT'},
 metadata:{type:mongoose.Schema.Types.Mixed,default:{}}
},{timestamps:true});
schema.index({companyId:1,number:1},{unique:true});
module.exports=mongoose.model('Contract',schema);
