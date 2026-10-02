const mongoose=require('mongoose');
const geoSchema=new mongoose.Schema({
 latitude:Number,longitude:Number,accuracy:Number,address:String,capturedAt:Date,
 source:{type:String,enum:['DEVICE','DEMO','IMPORTED','MANUAL'],default:'DEVICE'},
 capturedByUserId:mongoose.Schema.Types.ObjectId,capturedByName:String,capturedByRole:String
},{_id:false});
const fileSchema=new mongoose.Schema({url:String,publicId:String,name:String,mimeType:String,geo:geoSchema},{_id:false});
const schema=new mongoose.Schema({
 companyId:{type:mongoose.Schema.Types.ObjectId,ref:'Organization',required:true,index:true},farmerId:{type:mongoose.Schema.Types.ObjectId,ref:'Farmer',required:true,index:true},workPackageId:{type:mongoose.Schema.Types.ObjectId,ref:'WorkPackage'},agencyId:{type:mongoose.Schema.Types.ObjectId,ref:'Organization'},requirementId:{type:mongoose.Schema.Types.ObjectId,ref:'EvidenceRequirement',required:true,index:true},
 stage:{type:String,enum:['SURVEY','INSTALLATION','FINAL_INSPECTION'],required:true,index:true},status:{type:String,enum:['PENDING','SUBMITTED','VERIFIED','REJECTED','WAIVED'],default:'PENDING',index:true},submissionSource:{type:String,enum:['AGENCY_FIELD_SURVEY','AGENCY_FIELD_INSTALLATION','AGENCY_EVIDENCE_CHECKLIST','PLATFORM','IMPORT','DEMO'],default:'AGENCY_EVIDENCE_CHECKLIST',index:true},files:{type:[fileSchema],default:[]},value:mongoose.Schema.Types.Mixed,notes:String,captureGeo:geoSchema,
 submittedByLegacyUser:{type:mongoose.Schema.Types.ObjectId,ref:'User'},submittedByPlatformUser:{type:mongoose.Schema.Types.ObjectId,ref:'PlatformUser'},verifiedBy:{type:mongoose.Schema.Types.ObjectId,ref:'PlatformUser'},verifiedAt:Date
},{timestamps:true});
schema.index({companyId:1,farmerId:1,requirementId:1},{unique:true});
schema.index({companyId:1,'captureGeo.latitude':1,'captureGeo.longitude':1});

schema.index({companyId:1,farmerId:1,stage:1,updatedAt:-1});
module.exports=mongoose.model('EvidenceSubmission',schema);
