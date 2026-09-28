const mongoose=require('mongoose');
const schema=new mongoose.Schema({
 companyId:{type:mongoose.Schema.Types.ObjectId,ref:'Organization',required:true,index:true}, programId:{type:mongoose.Schema.Types.ObjectId,ref:'Program',required:true,index:true}, contractId:{type:mongoose.Schema.Types.ObjectId,ref:'Contract',default:null,index:true}, number:{type:String,required:true}, title:String,
 loaNumber:String,tenderNumber:String, sanctionedQuantity:{type:Number,default:0}, contractValue:{type:Number,default:0}, currency:{type:String,default:'INR'}, startDate:Date,dueDate:Date,
 status:{type:String,enum:['DRAFT','ACTIVE','ON_HOLD','COMPLETED','CLOSED'],default:'DRAFT'}, metadata:{type:mongoose.Schema.Types.Mixed,default:{}}
},{timestamps:true});
schema.index({companyId:1,number:1},{unique:true});
module.exports=mongoose.model('WorkOrder',schema);
