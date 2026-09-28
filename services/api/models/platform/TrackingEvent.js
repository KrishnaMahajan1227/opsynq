const mongoose=require('mongoose');
const schema=new mongoose.Schema({
 companyId:{type:mongoose.Schema.Types.ObjectId,ref:'Organization',required:true,index:true},
 shipmentId:{type:mongoose.Schema.Types.ObjectId,ref:'Shipment',required:true,index:true},
 driverId:{type:mongoose.Schema.Types.ObjectId,ref:'Driver'},
 latitude:Number,longitude:Number,accuracy:Number,speed:Number,heading:Number,
 source:{type:String,enum:['DRIVER_LINK','PLATFORM','SYSTEM'],default:'DRIVER_LINK'},
 capturedAt:{type:Date,default:Date.now,index:true},
 metadata:{type:mongoose.Schema.Types.Mixed,default:{}}
},{timestamps:true});
schema.index({shipmentId:1,capturedAt:-1});
module.exports=mongoose.model('TrackingEvent',schema);
