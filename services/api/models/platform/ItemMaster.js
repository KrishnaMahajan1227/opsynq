const mongoose=require('mongoose');
const schema=new mongoose.Schema({
 companyId:{type:mongoose.Schema.Types.ObjectId,ref:'Organization',required:true,index:true}, sku:{type:String,required:true}, name:{type:String,required:true}, category:String,brand:String,manufacturer:String,model:String,uom:{type:String,default:'EA'},
 specifications:{type:mongoose.Schema.Types.Mixed,default:{}}, metadata:{type:mongoose.Schema.Types.Mixed,default:{}}, serialTracked:{type:Boolean,default:false},batchTracked:{type:Boolean,default:false}, barcodeFormats:{type:[String],default:[]},minStock:{type:Number,default:0},reorderLevel:{type:Number,default:0},warrantyMonths:Number,installationRole:{type:String,enum:['NONE','PUMP','MOTOR','CONTROLLER','PANEL','OTHER'],default:'NONE',index:true},isActive:{type:Boolean,default:true}
},{timestamps:true});
schema.index({companyId:1,sku:1},{unique:true});
module.exports=mongoose.model('ItemMaster',schema);
