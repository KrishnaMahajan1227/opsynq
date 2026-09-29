const mongoose=require('mongoose');
const schema=new mongoose.Schema({
 companyId:{type:mongoose.Schema.Types.ObjectId,ref:'Organization',required:true,unique:true,index:true},offlineWarningAfterMinutes:{type:Number,default:5},offlineCriticalAfterMinutes:{type:Number,default:15},lowPerformanceThresholdKw:{type:Number,default:.4},locationToleranceMeters:{type:Number,default:500},autoIncidentPolicy:{type:String,enum:['ALERT_ONLY','MANUAL_SERVICE_CREATION','AUTO_CREATE_CRITICAL_INCIDENT'],default:'ALERT_ONLY'},agencyAccess:{type:Boolean,default:true},technicianDiagnostics:{type:Boolean,default:true},rmsInventoryTracking:{type:Boolean,default:true}
},{timestamps:true});
module.exports=mongoose.model('RmsRuleConfig',schema);
