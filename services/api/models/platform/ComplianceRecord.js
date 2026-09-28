const mongoose=require('mongoose');
const itemSchema=new mongoose.Schema({key:String,label:String,required:{type:Boolean,default:true},status:{type:String,enum:['PENDING','PASS','FAIL','WAIVED'],default:'PENDING'},notes:String,evidence:[String],checkedAt:Date},{_id:false});
const schema=new mongoose.Schema({
 companyId:{type:mongoose.Schema.Types.ObjectId,ref:'Organization',required:true,index:true},
 programId:{type:mongoose.Schema.Types.ObjectId,ref:'Program',index:true},workPackageId:{type:mongoose.Schema.Types.ObjectId,ref:'WorkPackage',index:true},
 agencyId:{type:mongoose.Schema.Types.ObjectId,ref:'Organization',index:true},farmerId:{type:mongoose.Schema.Types.ObjectId,ref:'Farmer',index:true},installedAssetId:{type:mongoose.Schema.Types.ObjectId,ref:'InstalledAsset',index:true},
 recordNo:{type:String,required:true,index:true},type:{type:String,enum:['INSTALLATION','FINAL_INSPECTION','COMMISSIONING','CLAIM_READINESS','SERVICE'],default:'INSTALLATION',index:true},
 status:{type:String,enum:['DRAFT','IN_REVIEW','PASS','FAIL','WAIVED'],default:'DRAFT',index:true},items:{type:[itemSchema],default:[]},
 geo:{latitude:Number,longitude:Number,accuracy:Number,capturedAt:Date},reviewedBy:{type:mongoose.Schema.Types.ObjectId,ref:'PlatformUser'},reviewedAt:Date,notes:String,metadata:{type:mongoose.Schema.Types.Mixed,default:{}}
},{timestamps:true});
schema.index({companyId:1,recordNo:1},{unique:true});schema.index({companyId:1,status:1,type:1});
module.exports=mongoose.model('ComplianceRecord',schema);
