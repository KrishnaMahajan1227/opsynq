const mongoose=require('mongoose');
const schema=new mongoose.Schema({
 companyId:{type:mongoose.Schema.Types.ObjectId,ref:'Organization',required:true,index:true},
 category:{type:String,enum:['CONTRACT','LOA','PURCHASE_ORDER','INVOICE','GRN','DELIVERY_PROOF','INSPECTION','BENEFICIARY','WARRANTY','SERVICE','CLAIM','OTHER'],default:'OTHER',index:true},
 title:{type:String,required:true},documentNo:String,
 entityType:String,entityId:mongoose.Schema.Types.ObjectId,
 fileUrl:{type:String,required:true},publicId:String,fileName:String,mimeType:String,size:Number,
 version:{type:Number,default:1},status:{type:String,enum:['ACTIVE','SUPERSEDED','ARCHIVED'],default:'ACTIVE'},
 uploadedBy:{type:mongoose.Schema.Types.ObjectId,ref:'PlatformUser'},notes:String
},{timestamps:true});
schema.index({companyId:1,category:1,createdAt:-1});
module.exports=mongoose.model('DocumentRecord',schema);
