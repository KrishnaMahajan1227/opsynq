require('dotenv').config();
const mongoose=require('mongoose');
const {validateTarget}=require('./demoDbGuard');
const Organization=require('../models/platform/Organization');
const Program=require('../models/platform/Program');
const Contract=require('../models/platform/Contract');
const WorkOrder=require('../models/platform/WorkOrder');
const WorkPackage=require('../models/platform/WorkPackage');
const CommercialClaim=require('../models/platform/CommercialClaim');

const daysAgo=n=>new Date(Date.now()-n*86400000);
const daysFromNow=n=>new Date(Date.now()+n*86400000);
const fail=m=>{throw new Error(m)};

(async()=>{
  await validateTarget({destructive:false});
  const company=await Organization.findOne({type:'COMPANY',code:'SKEPL',status:{$ne:'ARCHIVED'}});
  if(!company)fail('SKEPL demo company not found. Run the full demo seed first.');
  const [mh,hr]=await Promise.all([
    Program.findOne({companyId:company._id,code:'PMK-2026-MH'}),
    Program.findOne({companyId:company._id,code:'PMK-2026-HR'}),
  ]);
  if(!mh||!hr)fail('Expected Maharashtra/Haryana demo programs are missing. Run the full demo seed first.');
  const [mhContract,hrContract,mhWo,hrWo,mhWp,hrWp]=await Promise.all([
    Contract.findOne({companyId:company._id,number:'SKEPL/PMK/2026/001'}),
    Contract.findOne({companyId:company._id,number:'SKEPL/PMK/HR/2026/001'}),
    WorkOrder.findOne({companyId:company._id,number:'WO-SKEPL-001'}),
    WorkOrder.findOne({companyId:company._id,number:'WO-SKEPL-HR-001'}),
    WorkPackage.findOne({companyId:company._id,code:'WP-NAG-001'}),
    WorkPackage.findOne({companyId:company._id,code:'WP-HR-001'}),
  ]);
  if([mhContract,hrContract,mhWo,hrWo,mhWp,hrWp].some(x=>!x))fail('Expected demo commercial/work-package hierarchy is incomplete. Run the full demo seed first.');
  const rows=[
    {claimNo:'CLM-SKEPL-001',programId:mh._id,contractId:mhContract._id,workOrderId:mhWo._id,workPackageId:mhWp._id,title:'Nagpur Completed Installation Claim',status:'SUBMITTED',currency:'INR',grossAmount:845000,eligibleAmount:810000,approvedAmount:0,paidAmount:0,blockedAmount:0,beneficiaryCount:2,readyAt:daysAgo(4),submittedAt:daysAgo(3),approvedAt:null,paidAt:null,dueAt:daysFromNow(7),slaState:'ON_TRACK',blockedReason:'',notes:'Submitted client receivable backed by closed Nagpur installations, completion evidence and final inspection records.',metadata:{demoStory:'SUBMITTED_RECEIVABLE',beneficiaryRefs:['OPS-DM-019','OPS-DM-016']}},
    {claimNo:'CLM-SKEPL-002',programId:hr._id,contractId:hrContract._id,workOrderId:hrWo._id,workPackageId:hrWp._id,title:'Haryana Commissioned Sites - Paid Claim',status:'PAID',currency:'INR',grossAmount:720000,eligibleAmount:690000,approvedAmount:680000,paidAmount:680000,blockedAmount:0,beneficiaryCount:2,readyAt:daysAgo(18),submittedAt:daysAgo(16),approvedAt:daysAgo(10),paidAt:daysAgo(5),dueAt:daysAgo(4),slaState:'NOT_APPLICABLE',blockedReason:'',notes:'Fully realized Haryana claim for OPS-HR-028 and OPS-HR-029 after verified commissioning and final inspection PASS.',metadata:{demoStory:'PAID_REALIZED',beneficiaryRefs:['OPS-HR-028','OPS-HR-029']}},
    {claimNo:'CLM-SKEPL-003',programId:mh._id,contractId:mhContract._id,workOrderId:mhWo._id,workPackageId:mhWp._id,title:'Nagpur Milestone Claim - Partial Approval',status:'PARTIALLY_APPROVED',currency:'INR',grossAmount:610000,eligibleAmount:580000,approvedAmount:520000,paidAmount:260000,blockedAmount:60000,blockedReason:'Client measurement reconciliation pending for one milestone line.',beneficiaryCount:3,readyAt:daysAgo(12),submittedAt:daysAgo(10),approvedAt:daysAgo(4),paidAt:null,dueAt:daysFromNow(2),slaState:'DUE_SOON',notes:'Demonstrates approved, paid, receivable and blocked value in the same governed claim.',metadata:{demoStory:'PARTIAL_BLOCKED',beneficiaryRefs:['OPS-DM-005','OPS-DM-015','OPS-DM-019']}},
    {claimNo:'CLM-SKEPL-004',programId:hr._id,contractId:hrContract._id,workOrderId:hrWo._id,workPackageId:hrWp._id,title:'Haryana Next Milestone Claim Packet',status:'READY',currency:'INR',grossAmount:390000,eligibleAmount:360000,approvedAmount:0,paidAmount:0,blockedAmount:0,beneficiaryCount:2,readyAt:daysAgo(1),submittedAt:null,approvedAt:null,paidAt:null,dueAt:daysFromNow(5),slaState:'ON_TRACK',blockedReason:'',notes:'Commercial packet is ready for finance review; submission has not yet been made.',metadata:{demoStory:'READY_TO_SUBMIT',beneficiaryRefs:['OPS-HR-026','OPS-HR-027']}},
  ];
  for(const row of rows){
    await CommercialClaim.findOneAndUpdate({companyId:company._id,claimNo:row.claimNo},{$set:{companyId:company._id,...row}},{upsert:true,new:true,setDefaultsOnInsert:true});
    console.log(`✓ finance demo claim ready: ${row.claimNo} · ${row.status}`);
  }
  console.log('✓ Finance demo refresh completed without changing beneficiaries, inventory, RMS or protected accounts.');
})().catch(e=>{console.error(`✗ Finance demo refresh failed: ${e.message}`);process.exitCode=1}).finally(async()=>{try{await mongoose.connection.close()}catch{}});
