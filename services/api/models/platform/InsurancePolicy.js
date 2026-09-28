const mongoose=require('mongoose');
const schema=new mongoose.Schema({
 companyId:{type:mongoose.Schema.Types.ObjectId,ref:'Organization',required:true,index:true},
 farmerId:{type:mongoose.Schema.Types.ObjectId,ref:'Farmer',required:true,index:true},
 installedAssetId:{type:mongoose.Schema.Types.ObjectId,ref:'InstalledAsset',index:true},
 policyNumber:{type:String,required:true,trim:true},referenceNumber:String,
 insurer:{type:String,required:true,trim:true},policyType:{type:String,enum:['ASSET','PUMP','MOTOR','CONTROLLER','SOLAR_ARRAY','COMPREHENSIVE','OTHER'],default:'COMPREHENSIVE',index:true},
 coverageAmount:{type:Number,default:0,min:0},premiumAmount:{type:Number,default:0,min:0},currency:{type:String,default:'INR'},
 startDate:{type:Date,required:true,index:true},endDate:{type:Date,required:true,index:true},
 status:{type:String,enum:['DRAFT','ACTIVE','EXPIRING','EXPIRED','CANCELLED','CLAIM_OPEN','CLAIM_SETTLED'],default:'ACTIVE',index:true},
 documentUrl:String,documentFileName:String,claimNumber:String,claimStatus:String,claimOpenedAt:Date,claimSettledAt:Date,
 notes:String,metadata:{type:mongoose.Schema.Types.Mixed,default:{}},createdBy:{type:mongoose.Schema.Types.ObjectId,ref:'PlatformUser'}
},{timestamps:true});
schema.index({companyId:1,policyNumber:1},{unique:true});
schema.index({companyId:1,status:1,endDate:1});
module.exports=mongoose.model('InsurancePolicy',schema);
