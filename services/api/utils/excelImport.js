const XLSX=require('xlsx');

const ROW_TYPE_HEADER='OPSYNQ Row Type';
const SAMPLE='SAMPLE';
const IMPORT='IMPORT';
const RESERVED_HEADERS=new Set([ROW_TYPE_HEADER]);
const text=v=>String(v??'').trim();

function cleanImportRows(sheet){
  const rows=XLSX.utils.sheet_to_json(sheet,{defval:''});
  return rows.filter(row=>{
    const type=text(row?.[ROW_TYPE_HEADER]).toUpperCase();
    if(type===SAMPLE)return false;
    return Object.entries(row||{}).some(([key,value])=>!RESERVED_HEADERS.has(key)&&text(value)!=='');
  }).map((row,index)=>{
    const cleaned=Object.fromEntries(Object.entries(row||{}).filter(([key])=>!RESERVED_HEADERS.has(key)));
    const excelRow=Number.isFinite(Number(row?.__rowNum__))?Number(row.__rowNum__)+1:index+2;
    Object.defineProperty(cleaned,'__opsynqRowNumber',{value:excelRow,enumerable:false,configurable:false});
    return cleaned;
  });
}

function rowNumber(row,fallback=0){return Number(row?.__opsynqRowNumber)||Number(fallback)||0;}
function sheetHeaders(sheet){
  const first=XLSX.utils.sheet_to_json(sheet,{header:1,defval:''})[0]||[];
  return first.map(text).filter(Boolean).filter(header=>!RESERVED_HEADERS.has(header));
}

function safeExtraKey(key){return String(key||'').trim().replace(/\./g,' · ').replace(/^\$/,'＄').slice(0,120);}
function extraFields(row,known){
  return Object.fromEntries(Object.entries(row||{}).filter(([key,value])=>!known.has(key)&&!RESERVED_HEADERS.has(key)&&text(value)!=='').map(([key,value])=>[safeExtraKey(key),value]));
}


function setWidths(ws,columns){
  ws['!cols']=columns.map(header=>({wch:Math.min(34,Math.max(12,String(header).length+3))}));
  ws['!autofilter']={ref:`A1:${XLSX.utils.encode_col(Math.max(0,columns.length-1))}1`};
}

function addValidations(ws,columns,validations,maxRows=2000){
  const rules=[];
  const index=new Map(columns.map((name,i)=>[name,i]));
  for(const [header,values] of Object.entries(validations||{})){
    if(!index.has(header)||!Array.isArray(values)||!values.length)continue;
    const col=XLSX.utils.encode_col(index.get(header));
    rules.push({
      ref:`${col}2:${col}${maxRows}`,
      t:'List',
      l:values.map(String),
      blank:true,
      input:{title:header,message:`Choose an approved ${header} value or enter a permitted value.`},
      error:{title:`Invalid ${header}`,message:`Use one of the approved ${header} values.`,style:'warning'}
    });
  }
  if(rules.length)ws['!validations']=rules;
}

function buildGuidedWorkbook({sheetName='Import Data',columns=[],samples=[],validations={},instructions=[]}){
  const allColumns=[ROW_TYPE_HEADER,...columns];
  const sampleRows=(samples||[]).slice(0,2).map(row=>({[ROW_TYPE_HEADER]:SAMPLE,...row}));
  const rows=[...sampleRows,{[ROW_TYPE_HEADER]:IMPORT,...Object.fromEntries(columns.map(c=>[c,'']))}];
  const ws=XLSX.utils.json_to_sheet(rows,{header:allColumns});
  setWidths(ws,allColumns);
  addValidations(ws,allColumns,{[ROW_TYPE_HEADER]:[SAMPLE,IMPORT],...validations});
  const wb=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,ws,sheetName);

  const helpRows=[
    ['OPSYNQ Excel Import Guide'],
    ['How to use','Two SAMPLE rows are included in the first sheet. Replace them or add real rows marked IMPORT. SAMPLE rows are ignored automatically by the importer.'],
    ['Standard columns','Do not rename required standard headers.'],
    ['Extra columns','You may add extra columns. They are preserved as Additional Imported Fields / Custom Fields and shown in the relevant record detail screens.'],
    ['Duplicates','Existing records are never silently overwritten. Depending on the module they are reviewed, updated, skipped, or reported in the import summary.'],
    ['Errors','Valid rows continue where safe; invalid rows are reported with row-level reasons.'],
    ['Dropdowns','Approved list values are provided for controlled columns. The Allowed Values sheet is the reference if your spreadsheet app does not render the dropdown.'],
    ...instructions.map(x=>Array.isArray(x)?x:[String(x)])
  ];
  const help=XLSX.utils.aoa_to_sheet(helpRows);
  help['!cols']=[{wch:24},{wch:100}];
  XLSX.utils.book_append_sheet(wb,help,'Instructions');

  const lookupEntries=Object.entries(validations||{}).filter(([,values])=>Array.isArray(values)&&values.length);
  if(lookupEntries.length){
    const width=Math.max(...lookupEntries.map(([,values])=>values.length),1);
    const lookupRows=[];
    for(let r=0;r<=width;r++)lookupRows.push(lookupEntries.map(([header,values])=>r===0?header:(values[r-1]??'')));
    const lookup=XLSX.utils.aoa_to_sheet(lookupRows);
    lookup['!cols']=lookupEntries.map(([header])=>({wch:Math.min(40,Math.max(16,header.length+4))}));
    XLSX.utils.book_append_sheet(wb,lookup,'Allowed Values');
  }
  return wb;
}

function workbookBuffer(options){
  return XLSX.write(buildGuidedWorkbook(options),{type:'buffer',bookType:'xlsx',compression:true});
}

module.exports={ROW_TYPE_HEADER,SAMPLE,IMPORT,RESERVED_HEADERS,cleanImportRows,rowNumber,sheetHeaders,extraFields,buildGuidedWorkbook,workbookBuffer};
