const mongoose=require('mongoose');
const schema=new mongoose.Schema({
 companyId:{type:mongoose.Schema.Types.ObjectId,ref:'Organization',required:true,index:true},
 warehouseId:{type:mongoose.Schema.Types.ObjectId,ref:'Warehouse',required:true,index:true},
 itemId:{type:mongoose.Schema.Types.ObjectId,ref:'ItemMaster',required:true,index:true},
 status:{type:String,enum:['OPEN','DRAFT_PO','APPROVED','DISMISSED','RESOLVED'],default:'OPEN',index:true},
 urgency:{type:String,enum:['LOW','MEDIUM','HIGH','CRITICAL'],default:'MEDIUM',index:true},
 onHand:{type:Number,default:0},allocated:{type:Number,default:0},inTransit:{type:Number,default:0},incomingShipmentQty:{type:Number,default:0},openPurchaseOrderQty:{type:Number,default:0},
 minStock:{type:Number,default:0},reorderLevel:{type:Number,default:0},outbound30d:{type:Number,default:0},dailyUsage:{type:Number,default:0},daysCover:{type:Number,default:null},
 projectedAvailable:{type:Number,default:0},targetStock:{type:Number,default:0},suggestedQty:{type:Number,default:0},leadTimeDays:{type:Number,default:14},safetyDays:{type:Number,default:7},
 supplierName:String,estimatedUnitCost:{type:Number,default:0},estimatedOrderValue:{type:Number,default:0},currency:{type:String,default:'INR'},
 reason:String,
 ai:{summary:String,risk:String,recommendation:String,model:String,generatedAt:Date,status:{type:String,enum:['NOT_REQUESTED','READY','UNAVAILABLE','FAILED'],default:'NOT_REQUESTED'}},
 draftPurchaseOrderId:{type:mongoose.Schema.Types.ObjectId,ref:'PurchaseOrder'},approvalRequestId:{type:mongoose.Schema.Types.ObjectId,ref:'ApprovalRequest'},
 generatedAt:{type:Date,default:Date.now,index:true},dismissedReason:String,createdBy:{type:mongoose.Schema.Types.ObjectId,ref:'PlatformUser'},approvedBy:{type:mongoose.Schema.Types.ObjectId,ref:'PlatformUser'},approvedAt:Date
},{timestamps:true});
schema.index({companyId:1,warehouseId:1,itemId:1},{unique:true});
module.exports=mongoose.model('ReplenishmentPlan',schema);
