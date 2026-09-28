const mongoose=require('mongoose');
const schema=new mongoose.Schema({
 companyId:{type:mongoose.Schema.Types.ObjectId,ref:'Organization',required:true,index:true},
 warehouseId:{type:mongoose.Schema.Types.ObjectId,ref:'Warehouse',required:true,index:true},
 itemId:{type:mongoose.Schema.Types.ObjectId,ref:'ItemMaster',required:true,index:true},
 status:{type:String,enum:['OPEN','DRAFT_PO_CREATED','ORDERED','RESOLVED','DISMISSED'],default:'OPEN',index:true},
 severity:{type:String,enum:['WARNING','CRITICAL','OUT_OF_STOCK'],default:'WARNING',index:true},
 currentOnHand:{type:Number,default:0},inTransit:{type:Number,default:0},openPoQty:{type:Number,default:0},
 minStock:{type:Number,default:0},reorderLevel:{type:Number,default:0},avgDailyConsumption:{type:Number,default:0},daysCover:Number,
 recommendedQty:{type:Number,default:0},targetStock:{type:Number,default:0},leadDays:{type:Number,default:21},
 suggestedSupplierName:String,estimatedUnitCost:{type:Number,default:0},estimatedTaxPercent:{type:Number,default:0},estimatedOrderValue:{type:Number,default:0},currency:{type:String,default:'INR'},
 ruleRationale:String,aiRationale:String,aiProvider:String,aiGeneratedAt:Date,
 draftPurchaseOrderId:{type:mongoose.Schema.Types.ObjectId,ref:'PurchaseOrder'},lastEvaluatedAt:{type:Date,default:Date.now,index:true},
 dismissedBy:{type:mongoose.Schema.Types.ObjectId,ref:'PlatformUser'},dismissedAt:Date,dismissReason:String,
 metadata:{type:mongoose.Schema.Types.Mixed,default:{}}
},{timestamps:true});
schema.index({companyId:1,warehouseId:1,itemId:1},{unique:true});
schema.index({companyId:1,status:1,severity:1});
module.exports=mongoose.model('ReplenishmentRecommendation',schema);
