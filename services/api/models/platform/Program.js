const mongoose=require('mongoose');
const schema=new mongoose.Schema({
 companyId:{type:mongoose.Schema.Types.ObjectId,ref:'Organization',required:true,index:true}, name:{type:String,required:true}, code:{type:String,required:true}, country:{type:String,default:'India'}, state:String,
 authority:String, scheme:String, component:String, financialYear:String, sanctionedQuantity:{type:Number,default:0}, contractValue:{type:Number,default:0}, currency:{type:String,default:'INR'},
 startDate:Date,endDate:Date,status:{type:String,enum:['DRAFT','ACTIVE','ON_HOLD','COMPLETED','CLOSED'],default:'DRAFT'}, milestoneConfig:{type:[mongoose.Schema.Types.Mixed],default:[]}, slaConfig:{type:mongoose.Schema.Types.Mixed,default:{}}
},{timestamps:true});
schema.index({companyId:1,code:1},{unique:true});
module.exports=mongoose.model('Program',schema);
