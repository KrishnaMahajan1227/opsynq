const mongoose=require('mongoose');
const Organization=require('../../models/platform/Organization');
const Program=require('../../models/platform/Program');
const WorkOrder=require('../../models/platform/WorkOrder');
const WorkPackage=require('../../models/platform/WorkPackage');
const BeneficiaryContext=require('../../models/platform/BeneficiaryContext');
const InventorySerial=require('../../models/platform/InventorySerial');
const InstalledAsset=require('../../models/platform/InstalledAsset');
const Shipment=require('../../models/platform/Shipment');
const MaterialIssue=require('../../models/platform/MaterialIssue');
const Farmer=require('../../models/Farmer');

const companyIdFor=req=>req.platformUser.role==='platform_superadmin'?(req.query.companyId||req.body.companyId||req.params.companyId):String(req.tenant.companyId||'');
async function getCompany(req,res){const id=companyIdFor(req);if(!id){res.status(400).json({message:'Company context is required.'});return null}if(!mongoose.isValidObjectId(id)){res.status(400).json({message:'Invalid company id.'});return null}const company=await Organization.findOne({_id:id,type:'COMPANY',status:{$ne:'ARCHIVED'}}).lean();if(!company){res.status(404).json({message:'Company not found.'});return null}return company;}

const objectIds=rows=>new Set(rows.map(x=>String(x._id)));
const ratio=(a,b)=>b?Math.round((a/b)*100):100;

exports.companyReadiness=async(req,res)=>{
  const company=await getCompany(req,res);if(!company)return;
  const cid=company._id;
  const [programs,orders,packages,beneficiaries,serials,assets,shipments,issues,agencies,orphanFarmerRows]=await Promise.all([
    Program.find({companyId:cid}).select('_id status').lean(),
    WorkOrder.find({companyId:cid}).select('_id programId contractId status').lean(),
    WorkPackage.find({companyId:cid}).select('_id programId workOrderId agencyId status assignedQuantity').lean(),
    BeneficiaryContext.find({companyId:cid}).select('_id farmerId programId workOrderId workPackageId agencyId validationStatus').lean(),
    InventorySerial.find({companyId:cid}).select('_id itemId warehouseId agencyId farmerId status').lean(),
    InstalledAsset.find({companyId:cid}).select('_id inventorySerialId farmerId agencyId workPackageId status').lean(),
    Shipment.find({companyId:cid}).select('_id status driverId vehicleId agencyId fromWarehouseId toWarehouseId items deliveredAt').lean(),
    MaterialIssue.find({companyId:cid}).select('_id agencyId technicianUserId warehouseId workPackageId farmerId items status').lean(),
    Organization.find({parentOrganization:cid,type:'AGENCY',status:{$ne:'ARCHIVED'}}).select('_id').lean(),
    BeneficiaryContext.aggregate([{$match:{companyId:cid}},{$lookup:{from:Farmer.collection.name,localField:'farmerId',foreignField:'_id',as:'farmerRef'}},{$match:{'farmerRef.0':{$exists:false}}},{$count:'count'}])
  ]);

  const pIds=objectIds(programs),oIds=objectIds(orders),wpIds=objectIds(packages),agencyIds=objectIds(agencies),serialIds=objectIds(serials),assetSerialIds=new Set(assets.map(a=>String(a.inventorySerialId)));
  const critical=[],warnings=[];
  const add=(bucket,key,label,count,detail,module)=>{if(count>0)bucket.push({key,label,count,detail,module});};

  add(critical,'wp_program_missing','Work packages with missing program',packages.filter(x=>!pIds.has(String(x.programId))).length,'Program reference no longer resolves.','work-packages');
  add(critical,'wp_order_missing','Work packages with missing work order',packages.filter(x=>!oIds.has(String(x.workOrderId))).length,'Work order reference no longer resolves.','work-packages');
  add(critical,'wp_agency_missing','Assigned packages with missing agency',packages.filter(x=>x.agencyId&&!agencyIds.has(String(x.agencyId))).length,'Agency assignment points to a missing/archived organization.','work-packages');
  add(critical,'beneficiary_farmer_missing','Beneficiary contexts with missing farmer record',orphanFarmerRows?.[0]?.count||0,'Execution context exists but the underlying Farmer record no longer resolves.','beneficiary-imports');
  add(critical,'beneficiary_wp_missing','Beneficiaries with missing work package',beneficiaries.filter(x=>!wpIds.has(String(x.workPackageId))).length,'Beneficiary execution context is orphaned.','beneficiary-imports');
  add(critical,'beneficiary_agency_missing','Beneficiaries with missing agency',beneficiaries.filter(x=>!agencyIds.has(String(x.agencyId))).length,'Beneficiary agency context is invalid.','beneficiary-imports');
  add(warnings,'beneficiary_invalid','Beneficiaries not in VALID state',beneficiaries.filter(x=>x.validationStatus!=='VALID').length,'Review INVALID, DUPLICATE or PENDING import rows.','beneficiary-imports');

  add(critical,'installed_serial_missing','Installed assets with missing inventory serial',assets.filter(a=>!serialIds.has(String(a.inventorySerialId))).length,'Installed asset points to a serial record that no longer exists.','installed-assets');
  add(critical,'serial_asset_missing','INSTALLED serials without installed asset',serials.filter(s=>s.status==='INSTALLED'&&!assetSerialIds.has(String(s._id))).length,'Serial state says INSTALLED but no Installed Asset record exists.','reconciliation');
  add(critical,'asset_serial_state','Active assets whose serial is not INSTALLED',assets.filter(a=>a.status==='ACTIVE'&&serials.find(s=>String(s._id)===String(a.inventorySerialId))?.status!=='INSTALLED').length,'Asset and physical serial lifecycle are inconsistent.','reconciliation');
  add(warnings,'installed_without_farmer','Installed serials missing farmer link',serials.filter(s=>s.status==='INSTALLED'&&!s.farmerId).length,'Installed inventory should be traceable to a farmer/beneficiary.','reconciliation');

  add(critical,'shipment_empty','Active shipments with no lines',shipments.filter(s=>!['CANCELLED'].includes(s.status)&&(!s.items||s.items.length===0)).length,'Shipment cannot be reconciled without item lines.','shipments');
  add(warnings,'delivered_without_time','Delivered shipments missing delivery timestamp',shipments.filter(s=>s.status==='DELIVERED'&&!s.deliveredAt).length,'Delivery state should have an auditable deliveredAt timestamp.','shipments');
  add(warnings,'shipment_receipt_overage','Shipment lines with receipt totals above dispatched quantity',shipments.reduce((n,s)=>n+(s.items||[]).filter(i=>(Number(i.receivedQty||0)+Number(i.damagedQty||0)+Number(i.missingQty||0))>Number(i.quantity||0)).length,0),'Receipt reconciliation exceeds dispatched quantity.','shipments');
  add(warnings,'issue_empty','Material issues with no item lines',issues.filter(i=>!i.items?.length).length,'Issued custody record has no material lines.','material-issues');

  const totals={programs:programs.length,workOrders:orders.length,workPackages:packages.length,beneficiaries:beneficiaries.length,serials:serials.length,installedAssets:assets.length,shipments:shipments.length,materialIssues:issues.length};
  const totalProblems=critical.reduce((n,x)=>n+x.count,0)+warnings.reduce((n,x)=>n+x.count,0);
  const checks=15;
  const failedChecks=critical.length+warnings.length;
  const score=Math.max(0,Math.round(((checks-Math.min(checks,failedChecks))/checks)*100));
  res.json({company:{id:String(company._id),name:company.name,code:company.code},generatedAt:new Date().toISOString(),database:{connected:mongoose.connection.readyState===1,name:mongoose.connection.name||null},score,status:critical.length?'ATTENTION':warnings.length?'REVIEW':'READY',critical,warnings,totals,summary:{criticalIssues:critical.reduce((n,x)=>n+x.count,0),warnings:warnings.reduce((n,x)=>n+x.count,0),totalProblems,checks,passedChecks:Math.max(0,checks-failedChecks),beneficiaryValidity:ratio(beneficiaries.filter(x=>x.validationStatus==='VALID').length,beneficiaries.length)}});
};
