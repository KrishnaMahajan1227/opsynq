const mongoose=require('mongoose');
const lineSchema=new mongoose.Schema({itemId:{type:mongoose.Schema.Types.ObjectId,ref:'ItemMaster',required:true},quantity:{type:Number,required:true,min:0},acceptedQty:{type:Number,default:0,min:0},rejectedQty:{type:Number,default:0,min:0},serialIds:[{type:mongoose.Schema.Types.ObjectId,ref:'InventorySerial'}],batchNo:String,metadata:{type:mongoose.Schema.Types.Mixed,default:{}}},{_id:true});
const schema=new mongoose.Schema({companyId:{type:mongoose.Schema.Types.ObjectId,ref:'Organization',required:true,index:true},number:{type:String,required:true},purchaseOrderId:{type:mongoose.Schema.Types.ObjectId,ref:'PurchaseOrder'},warehouseId:{type:mongoose.Schema.Types.ObjectId,ref:'Warehouse',required:true},receivedAt:{type:Date,default:Date.now},supplierDocument:String,lines:{type:[lineSchema],default:[]},receivedBy:{type:mongoose.Schema.Types.ObjectId,ref:'PlatformUser'},notes:String,metadata:{type:mongoose.Schema.Types.Mixed,default:{}}},{timestamps:true});
schema.index({companyId:1,number:1},{unique:true});

schema.index({companyId:1,purchaseOrderId:1,receivedAt:-1});
module.exports=mongoose.model('GoodsReceipt',schema);
