const mongoose=require('mongoose');
const checkSchema=new mongoose.Schema({key:String,label:String,status:{type:String,enum:['PASS','FAIL','NA','PENDING'],default:'PENDING'},notes:String},{_id:false});
const schema=new mongoose.Schema({
 companyId:{type:mongoose.Schema.Types.ObjectId,ref:'Organization',required:true,index:true},
 pdiNumber:{type:String,required:true,trim:true},itemId:{type:mongoose.Schema.Types.ObjectId,ref:'ItemMaster',required:true,index:true},inventorySerialId:{type:mongoose.Schema.Types.ObjectId,ref:'InventorySerial',required:true,index:true},
 supplierId:{type:mongoose.Schema.Types.ObjectId,ref:'Organization'},supplierName:String,brand:String,model:String,
 inspectionDate:{type:Date,default:Date.now,index:true},inspectedBy:{type:mongoose.Schema.Types.ObjectId,ref:'PlatformUser'},
 result:{type:String,enum:['PENDING','PASS','FAIL','HOLD'],default:'PENDING',index:true},
 checklist:{type:[checkSchema],default:[]},evidenceUrls:{type:[String],default:[]},certificateUrl:String,
 disposition:{type:String,enum:['WAREHOUSE_ACCEPT','REJECT_RETURN','HOLD_FOR_REWORK','RELEASE_TO_AGENCY','NOT_DECIDED'],default:'NOT_DECIDED',index:true},
 warehouseId:{type:mongoose.Schema.Types.ObjectId,ref:'Warehouse'},agencyId:{type:mongoose.Schema.Types.ObjectId,ref:'Organization'},
 notes:String,metadata:{type:mongoose.Schema.Types.Mixed,default:{}}
},{timestamps:true});
schema.index({companyId:1,pdiNumber:1},{unique:true});
schema.index({companyId:1,inventorySerialId:1,inspectionDate:-1});
module.exports=mongoose.model('PDIRecord',schema);
