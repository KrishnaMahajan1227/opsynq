const mongoose=require('mongoose');
const schema=new mongoose.Schema({
 companyId:{type:mongoose.Schema.Types.ObjectId,ref:'Organization',required:true,index:true},
 domain:{type:String,enum:['GEOGRAPHY','COMMERCIAL','SUPPLY_CHAIN','FIELD_OPERATIONS'],required:true,index:true},
 type:{type:String,required:true,index:true},code:{type:String,required:true,trim:true,uppercase:true},label:{type:String,required:true,trim:true},
 parentCode:String,sortOrder:{type:Number,default:0},isActive:{type:Boolean,default:true,index:true},metadata:{type:mongoose.Schema.Types.Mixed,default:{}}
},{timestamps:true});
schema.index({companyId:1,type:1,code:1},{unique:true});
module.exports=mongoose.model('MasterDataEntry',schema);
