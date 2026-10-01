const mongoose=require('mongoose');

const itemSchema=new mongoose.Schema({
 inventorySerialId:{type:mongoose.Schema.Types.ObjectId,ref:'InventorySerial',required:true},
 itemId:{type:mongoose.Schema.Types.ObjectId,ref:'ItemMaster',required:true},
 role:{type:String,enum:['PUMP','MOTOR','CONTROLLER','PANEL','OTHER'],default:'OTHER'},
 serialNumber:{type:String,required:true},
 barcodeValue:String,
 assignmentScope:{type:String,enum:['BENEFICIARY','WORK_PACKAGE'],default:'BENEFICIARY'},
 condition:{type:String,enum:['GOOD','DAMAGED','MISSING'],default:'GOOD'},
 scannedAt:Date
},{_id:false});

const schema=new mongoose.Schema({
 companyId:{type:mongoose.Schema.Types.ObjectId,ref:'Organization',required:true,index:true},
 agencyId:{type:mongoose.Schema.Types.ObjectId,ref:'Organization',required:true,index:true},
 farmerId:{type:mongoose.Schema.Types.ObjectId,ref:'Farmer',required:true,index:true},
 workPackageId:{type:mongoose.Schema.Types.ObjectId,ref:'WorkPackage'},
 technicianUserId:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true,index:true},
 receiptNo:{type:String,required:true},
 revision:{type:Number,default:1,min:1},
 status:{type:String,enum:['CONFIRMED','PARTIAL','EXCEPTION','SUPERSEDED'],default:'CONFIRMED'},
 issueIds:[{type:mongoose.Schema.Types.ObjectId,ref:'MaterialIssue'}],
 items:{type:[itemSchema],default:[]},
 remarks:String,
 lrPhotoUrls:{type:[String],default:[]},
 farmerSignatureUrl:String,
 technicianSignatureUrl:String,
 receivedAt:{type:Date,default:Date.now},
 confirmedAt:{type:Date,default:Date.now}
},{timestamps:true});

schema.index({companyId:1,farmerId:1,revision:-1});
schema.index({companyId:1,farmerId:1,status:1});
schema.index({companyId:1,receiptNo:1},{unique:true});
module.exports=mongoose.model('BeneficiaryMaterialReceipt',schema);
