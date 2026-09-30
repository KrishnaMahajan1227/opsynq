const mongoose=require('mongoose');
const schema=new mongoose.Schema({
 farmerId:{type:mongoose.Schema.Types.ObjectId,ref:'Farmer',required:true,unique:true,index:true},
 companyId:{type:mongoose.Schema.Types.ObjectId,ref:'Organization',required:true,index:true},
 programId:{type:mongoose.Schema.Types.ObjectId,ref:'Program',required:true,index:true},
 workOrderId:{type:mongoose.Schema.Types.ObjectId,ref:'WorkOrder',required:true,index:true},
 workPackageId:{type:mongoose.Schema.Types.ObjectId,ref:'WorkPackage',required:true,index:true},
 agencyId:{type:mongoose.Schema.Types.ObjectId,ref:'Organization',required:true,index:true},
 sourceImportBatchId:{type:mongoose.Schema.Types.ObjectId,ref:'ImportBatch'},sourceRowNumber:Number,sourceAuthority:String,
 originalData:{type:mongoose.Schema.Types.Mixed,default:{}},normalizedData:{type:mongoose.Schema.Types.Mixed,default:{}},validationStatus:{type:String,enum:['PENDING','VALID','INVALID','DUPLICATE'],default:'PENDING'},
 assignedAt:Date,assignmentHistory:{type:[mongoose.Schema.Types.Mixed],default:[]}
},{timestamps:true});
schema.index({companyId:1,programId:1,workPackageId:1,agencyId:1});
schema.index({companyId:1,workOrderId:1,workPackageId:1});
schema.index({companyId:1,agencyId:1,updatedAt:-1});
schema.index({agencyId:1,farmerId:1});
schema.index({companyId:1,farmerId:1});
module.exports=mongoose.model('BeneficiaryContext',schema);
