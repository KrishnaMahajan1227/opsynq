const mongoose=require('mongoose');
const schema=new mongoose.Schema({
 companyId:{type:mongoose.Schema.Types.ObjectId,ref:'Organization',required:true,index:true},
 agencyId:{type:mongoose.Schema.Types.ObjectId,ref:'Organization',required:true,index:true},
 warehouseId:{type:mongoose.Schema.Types.ObjectId,ref:'Warehouse',required:true},
 technicianUserId:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true,index:true},
 workPackageId:{type:mongoose.Schema.Types.ObjectId,ref:'WorkPackage'},
 farmerId:{type:mongoose.Schema.Types.ObjectId,ref:'Farmer'},
 issueNo:{type:String,required:true},
 items:{type:[{itemId:{type:mongoose.Schema.Types.ObjectId,ref:'ItemMaster',required:true},quantity:{type:Number,required:true,min:1},serialIds:[{type:mongoose.Schema.Types.ObjectId,ref:'InventorySerial'}]}],default:[]},
 status:{type:String,enum:['ISSUED','PARTIALLY_RETURNED','RETURNED','CONSUMED'],default:'ISSUED'},
 issuedAt:{type:Date,default:Date.now},
 issuedBy:{type:mongoose.Schema.Types.ObjectId,ref:'PlatformUser'},
 notes:String
},{timestamps:true});
schema.index({companyId:1,issueNo:1},{unique:true});
module.exports=mongoose.model('MaterialIssue',schema);
