const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const files={
 util:read('services/api/utils/excelImport.js'),
 ops:read('services/api/controllers/platform/operationsController.js'),
 inv:read('services/api/controllers/platform/inventoryController.js'),
 assurance:read('services/api/controllers/platform/assuranceController.js'),
 farmer:read('services/api/controllers/farmerController.js'),
 agencyUpload:read('apps/agency-web/src/pages/UploadExcel.jsx'),
 agencyDetail:read('apps/agency-web/src/components/FarmerDetailView.jsx'),
 opsUi:read('apps/platform-web/src/features/company/operations/OperationsPages.jsx'),
 invUi:read('apps/platform-web/src/features/company/inventory/InventoryPages.jsx'),
 assuranceUi:read('apps/platform-web/src/features/company/assurance/AssurancePages.jsx'),
 fleetUi:read('apps/platform-web/src/features/company/logistics/LogisticsPages.jsx'),
};
const tests=[];
const test=(name,ok)=>tests.push({name,ok:!!ok});

test('Shared templates include SAMPLE and IMPORT row markers', files.util.includes("const SAMPLE='SAMPLE'")&&files.util.includes("const IMPORT='IMPORT'")&&files.util.includes("[ROW_TYPE_HEADER]:SAMPLE")&&files.util.includes("[ROW_TYPE_HEADER]:IMPORT"));
test('SAMPLE rows are automatically ignored by all importers', files.util.includes('if(type===SAMPLE)return false'));
test('Templates include Instructions and Allowed Values reference sheets', files.util.includes("'Instructions'")&&files.util.includes("'Allowed Values'"));
test('Controlled-value validation rules are attached to generated templates', files.util.includes("ws['!validations']")&&files.util.includes("t:'List'"));
test('Company beneficiary template has two realistic sample beneficiaries', files.ops.includes('SAMPLE-BEN-001')&&files.ops.includes('SAMPLE-BEN-002')&&files.ops.includes('downloadBeneficiaryTemplate'));
test('Item Master template has pump and panel examples plus governed choices', files.inv.includes('SAMPLE-PUMP-001')&&files.inv.includes('SAMPLE-PANEL-550')&&files.inv.includes("'Installation Role':['NONE','PUMP','MOTOR','CONTROLLER','PANEL','OTHER']"));
test('Master templates cover Agency, Warehouse, Driver and Vehicle sample rows', ['AGENCIES','WAREHOUSES','DRIVERS','VEHICLES'].every(x=>files.assurance.includes(`${x}:`))&&files.assurance.includes('Nagpur Central Warehouse')&&files.assurance.includes('MH40AB1001'));
test('Agency beneficiary/JSR templates include sample rows and live technician allowed values', files.farmer.includes('SAMPLE-BEN-001')&&files.farmer.includes("validations['Surveyor Name']=names")&&files.farmer.includes("validations['Installation Technician']=names"));
test('Actual Excel row numbers survive SAMPLE-row filtering for precise alerts', files.util.includes('__opsynqRowNumber')&&files.ops.includes('rowNumber(rows[i],i+2)')&&files.inv.includes('rowNumber(r,i+2)')&&files.assurance.includes('rowNumber(r,i+2)'));
test('Company beneficiary import blocks duplicate rows inside one workbook', files.ops.includes('Duplicate beneficiary ID inside this import file; later row skipped.'));
test('Item Master import blocks duplicate SKU rows inside one workbook', files.inv.includes('Duplicate SKU repeated inside the same import file; later row skipped.'));
test('Bulk master import blocks duplicate keys inside one workbook', files.assurance.includes('Duplicate key repeated inside this Excel file; later row skipped.'));
test('Agency beneficiary import blocks duplicate Beneficiary IDs inside one workbook', files.farmer.includes('Duplicate Beneficiary ID repeated inside the same Excel file; later row skipped.'));
test('Agency JSR import blocks duplicate Beneficiary IDs inside one workbook', files.farmer.includes('Duplicate Beneficiary ID repeated inside the same JSR file; later row skipped.'));
test('Exact-file duplicate protection remains on Company beneficiary and Item imports', files.ops.includes("fileHash:hash,type:'BENEFICIARY_IMPORT'")&&files.inv.includes("fileHash:hash,type:'ITEM_MASTER'"));
test('Agency duplicate detection is Beneficiary-ID based and tenant scoped before update', files.farmer.includes("Farmer.find({ beneficiaryId: { $in: candidateIds } })")&&files.farmer.includes('outside your Agency scope')&&files.farmer.includes('allowedFarmerIds'));
test('Extra columns are sanitized and preserved instead of becoming uncontrolled schema fields', files.util.includes('safeExtraKey')&&files.util.includes('extraFields')&&files.ops.includes('farmer.customFields=')&&files.farmer.includes('customFields: extraFields(row, jsrKnownHeaders)'));
test('Extra fields merge on updates instead of wiping previous imported metadata', files.inv.includes('const mergedExtras={...(current.metadata?.importExtras||{}),...(row.metadata.importExtras||{})}')&&files.ops.includes('...(ctx.normalizedData?.customFields||{})')&&files.farmer.includes('...(farmer.customFields || {}), ...(record.customFields || {})'));
test('Additional imported fields are visible in beneficiary, item, agency and fleet detail surfaces', files.opsUi.includes('Additional imported fields')&&files.invUi.includes('Additional imported fields')&&files.assuranceUi.includes('Additional imported fields')&&files.fleetUi.includes('Additional imported fields')&&files.agencyDetail.includes('farmer.customFields'));
test('Company import UIs show created/updated/skipped/failed and row-level issues', files.opsUi.includes('Review row-level issues')&&files.invUi.includes('Review row-level issues')&&files.assuranceUi.includes('Review')&&files.assuranceUi.includes('row issue'));
test('Agency import UI reports created/updated/skipped/failed instead of generic success only', files.agencyUpload.includes('Beneficiary import complete:')&&files.agencyUpload.includes('JSR import complete:'));
test('Agency missing required beneficiary rows fail before any write with row references', files.farmer.includes('No records were written.')&&files.farmer.includes('Beneficiary ID and Beneficiary Name are required.'));

let failed=0;
for(const t of tests){console.log(`${t.ok?'PASS':'FAIL'} ${t.name}`);if(!t.ok)failed++;}
console.log(`\nExcel import governance: ${tests.length-failed}/${tests.length} PASS`);
if(failed)process.exit(1);
