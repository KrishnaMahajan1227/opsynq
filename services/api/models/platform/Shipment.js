const mongoose=require('mongoose');
const shipmentLineSchema=new mongoose.Schema({
 itemId:{type:mongoose.Schema.Types.ObjectId,ref:'ItemMaster',required:true},
 quantity:{type:Number,required:true,min:1},
 serialIds:[{type:mongoose.Schema.Types.ObjectId,ref:'InventorySerial'}],
 receivedQty:{type:Number,default:0,min:0},
 damagedQty:{type:Number,default:0,min:0},
 missingQty:{type:Number,default:0,min:0},
 receiptNotes:String
},{_id:false});
const schema=new mongoose.Schema({
 companyId:{type:mongoose.Schema.Types.ObjectId,ref:'Organization',required:true,index:true},shipmentNo:{type:String,required:true},workPackageId:{type:mongoose.Schema.Types.ObjectId,ref:'WorkPackage'},fromWarehouseId:{type:mongoose.Schema.Types.ObjectId,ref:'Warehouse'},toWarehouseId:{type:mongoose.Schema.Types.ObjectId,ref:'Warehouse'},agencyId:{type:mongoose.Schema.Types.ObjectId,ref:'Organization'},driverId:{type:mongoose.Schema.Types.ObjectId,ref:'Driver'},vehicleId:{type:mongoose.Schema.Types.ObjectId,ref:'Vehicle'},items:{type:[shipmentLineSchema],default:[]},status:{type:String,enum:['DRAFT','DISPATCHED','IN_TRANSIT','DELIVERED','PARTIAL','CANCELLED'],default:'DRAFT'},trackingTokenHash:String,trackingExpiresAt:Date,dispatchedAt:Date,deliveredAt:Date,proofOfDelivery:{type:mongoose.Schema.Types.Mixed,default:{}}
},{timestamps:true});
schema.index({companyId:1,shipmentNo:1},{unique:true});

schema.index({companyId:1,agencyId:1,status:1,createdAt:-1});
schema.index({companyId:1,workPackageId:1,createdAt:-1});
module.exports=mongoose.model('Shipment',schema);
