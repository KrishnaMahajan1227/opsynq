const mongoose=require('mongoose');
const lineSchema=new mongoose.Schema({itemId:{type:mongoose.Schema.Types.ObjectId,ref:'ItemMaster',required:true},description:String,orderedQty:{type:Number,required:true,min:0},receivedQty:{type:Number,default:0,min:0},unitPrice:{type:Number,default:0,min:0},taxPercent:{type:Number,default:0,min:0}},{_id:true});
const schema=new mongoose.Schema({
 companyId:{type:mongoose.Schema.Types.ObjectId,ref:'Organization',required:true,index:true},number:{type:String,required:true},supplierId:{type:mongoose.Schema.Types.ObjectId,ref:'Organization',default:null},supplierName:String,
 warehouseId:{type:mongoose.Schema.Types.ObjectId,ref:'Warehouse',required:true},currency:{type:String,default:'INR'},orderDate:{type:Date,default:Date.now},expectedDate:Date,status:{type:String,enum:['DRAFT','ISSUED','PARTIAL','RECEIVED','CANCELLED'],default:'DRAFT'},lines:{type:[lineSchema],default:[]},notes:String,metadata:{type:mongoose.Schema.Types.Mixed,default:{}},createdBy:{type:mongoose.Schema.Types.ObjectId,ref:'PlatformUser'}
},{timestamps:true});
schema.index({companyId:1,number:1},{unique:true});

schema.index({companyId:1,status:1,orderDate:-1});
schema.index({companyId:1,warehouseId:1,status:1});
module.exports=mongoose.model('PurchaseOrder',schema);
