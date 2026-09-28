const mongoose=require('mongoose');
const schema=new mongoose.Schema({
 companyId:{type:mongoose.Schema.Types.ObjectId,ref:'Organization',required:true,index:true}, programId:{type:mongoose.Schema.Types.ObjectId,ref:'Program',required:true}, workOrderId:{type:mongoose.Schema.Types.ObjectId,ref:'WorkOrder',required:true},
 code:{type:String,required:true}, name:String, agencyId:{type:mongoose.Schema.Types.ObjectId,ref:'Organization',default:null,index:true}, geography:{country:String,state:String,district:String,taluka:String,villages:[String]},
 assignedQuantity:{type:Number,default:0}, assignedAt:Date,dueDate:Date,status:{type:String,enum:['DRAFT','READY','ASSIGNED','IN_PROGRESS','BLOCKED','COMPLETED','CLOSED'],default:'DRAFT'}, commercialTerms:{type:mongoose.Schema.Types.Mixed,default:{}}
},{timestamps:true});
schema.index({companyId:1,code:1},{unique:true});
module.exports=mongoose.model('WorkPackage',schema);
