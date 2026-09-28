const mongoose=require('mongoose');
const schema=new mongoose.Schema({
 companyId:{type:mongoose.Schema.Types.ObjectId,ref:'Organization',required:true,index:true},
 warehouseId:{type:mongoose.Schema.Types.ObjectId,ref:'Warehouse',required:true,index:true},
 itemId:{type:mongoose.Schema.Types.ObjectId,ref:'ItemMaster',required:true,index:true},
 onHand:{type:Number,default:0,min:0},allocated:{type:Number,default:0,min:0},inTransit:{type:Number,default:0,min:0},damaged:{type:Number,default:0,min:0},
 lastMovementAt:Date
},{timestamps:true});
schema.index({companyId:1,warehouseId:1,itemId:1},{unique:true});
module.exports=mongoose.model('InventoryBalance',schema);
