const mongoose=require('mongoose');
const schema=new mongoose.Schema({
  name:{type:String,required:true}, email:{type:String,lowercase:true,trim:true}, mobile:{type:String,required:true,unique:true}, password:{type:String,required:true},
  tokenVersion:{type:Number,default:0}, passwordChangedAt:{type:Date,default:null}, failedLoginAttempts:{type:Number,default:0}, lockUntil:{type:Date,default:null}, lastFailedLoginAt:{type:Date,default:null},
  role:{type:String,enum:['platform_superadmin','company_owner','company_admin','operations_manager','program_manager','inventory_manager','procurement_manager','finance_user','quality_user','logistics_manager','viewer'],required:true},
  organizationId:{type:mongoose.Schema.Types.ObjectId,ref:'Organization',default:null}, isActive:{type:Boolean,default:true}, approvalStatus:{type:String,enum:['PENDING','APPROVED','REJECTED'],default:'PENDING'},
  lastLocation:{latitude:Number,longitude:Number,accuracy:Number,address:String,capturedAt:Date,updatedAt:Date}, lastLoginAt:Date
},{timestamps:true});
schema.index({organizationId:1,role:1,isActive:1});
schema.index({email:1},{unique:true,sparse:true});
module.exports=mongoose.model('PlatformUser',schema);
