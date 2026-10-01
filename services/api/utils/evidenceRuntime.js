const EvidenceRequirement=require('../models/platform/EvidenceRequirement');
const EvidenceSubmission=require('../models/platform/EvidenceSubmission');

const LEGACY_DEFAULT_KEYS=new Set([
  'agency-beneficiary-photo',
  'agency-site-survey-photos',
  'agency-beneficiary-signature',
]);

const norm=v=>String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const has=(text,words=[])=>words.some(w=>text.includes(w));
const isCompleteStatus=status=>['SUBMITTED','VERIFIED','WAIVED'].includes(String(status||'').toUpperCase());
const isLegacyDefault=requirement=>LEGACY_DEFAULT_KEYS.has(String(requirement?.key||''));

function proofForRequirement(requirement={},proofs={}){
  const text=norm(`${requirement.key||''} ${requirement.label||''}`);
  const type=String(requirement.evidenceType||'').toUpperCase();
  if(type==='SIGNATURE'){
    if(has(text,['surveyor','technician','installer','engineer']))return proofs.technicianSignature||proofs.surveyorSignature||null;
    return proofs.beneficiarySignature||proofs.farmerSignature||null;
  }
  if(type==='PHOTO'){
    if(has(text,['beneficiary','farmer'])&&has(text,['photo','installed','system']))return proofs.beneficiaryPhoto||proofs.farmerPhoto||null;
    if(has(text,['site','survey','water','source','mounting','structure','commission','discharge','installation','final']))return proofs.sitePhotos||null;
    return proofs.sitePhotos||proofs.beneficiaryPhoto||proofs.farmerPhoto||null;
  }
  return null;
}

function normalizeProofFiles(value){
  const arr=Array.isArray(value)?value:(value?[value]:[]);
  return arr.filter(Boolean).map((f,i)=>({
    url:f.path||f.url||'',
    name:f.originalname||f.name||`evidence-${i+1}`,
    mimeType:f.mimetype||f.mimeType||'image/jpeg',
  })).filter(x=>x.url);
}

function governRequirements(requirements=[]){
  const groups=new Map();
  requirements.forEach(item=>{
    const stage=String(item?.stage||'');
    if(!groups.has(stage))groups.set(stage,[]);
    groups.get(stage).push(item);
  });
  const result=[];
  for(const rows of groups.values()){
    const governed=rows.filter(row=>!isLegacyDefault(row));
    result.push(...(governed.length?governed:rows));
  }
  return result.sort((a,b)=>String(a.stage||'').localeCompare(String(b.stage||''))||Number(a.sortOrder||0)-Number(b.sortOrder||0)||String(a.label||'').localeCompare(String(b.label||'')));
}

async function queryStageRequirements({companyId,programId,stages=[]}){
  if(!companyId)return[];
  const query={
    companyId,
    isActive:true,
    ...(stages.length?{stage:{$in:stages}}:{}),
    $or:[{programId:null},{programId:programId||null}],
  };
  return EvidenceRequirement.find(query).sort({stage:1,sortOrder:1,label:1}).lean();
}

async function getStageRequirements({companyId,programId,stages=[]}){
  const rows=await queryStageRequirements({companyId,programId,stages});
  return governRequirements(rows);
}

function legacyFallbackKey(requirement={}){
  if(String(requirement.stage||'').toUpperCase()!=='SURVEY')return'';
  const type=String(requirement.evidenceType||'').toUpperCase();
  const text=norm(`${requirement.key||''} ${requirement.label||''}`);
  if(type==='SIGNATURE')return 'agency-beneficiary-signature';
  if(type==='PHOTO'){
    if(has(text,['beneficiary','farmer'])&&!has(text,['site','survey','water','source']))return 'agency-beneficiary-photo';
    return 'agency-site-survey-photos';
  }
  return'';
}

function submissionSatisfies(requirement,submission){
  if(!submission||!isCompleteStatus(submission.status))return false;
  if(['PHOTO','DOCUMENT','SIGNATURE'].includes(String(requirement.evidenceType||'').toUpperCase())){
    return (submission.files||[]).length>=Math.max(0,Number(requirement.minFiles||1));
  }
  if(String(requirement.evidenceType||'').toUpperCase()==='BOOLEAN')return submission.value===true||String(submission.value).toLowerCase()==='true';
  if(String(requirement.evidenceType||'').toUpperCase()==='TEXT')return Boolean(String(submission.value||'').trim());
  return true;
}

async function getEvidenceChecklist({companyId,programId,farmerId,stages=[]}){
  const raw=await queryStageRequirements({companyId,programId,stages});
  const requirements=governRequirements(raw);
  if(!farmerId||!raw.length)return{requirements,submissions:[],checklist:requirements.map(requirement=>({requirement,submission:null}))};
  const rawIds=raw.map(item=>item._id);
  const submissions=await EvidenceSubmission.find({companyId,farmerId,requirementId:{$in:rawIds}}).lean();
  const byReq=new Map(submissions.map(item=>[String(item.requirementId),item]));
  const legacyByKey=new Map(raw.filter(isLegacyDefault).map(item=>[String(item.key),item]));
  const checklist=requirements.map(requirement=>{
    const direct=byReq.get(String(requirement._id));
    if(direct)return{requirement,submission:direct};
    const fallbackKey=legacyFallbackKey(requirement);
    const legacyReq=fallbackKey?legacyByKey.get(fallbackKey):null;
    const legacySub=legacyReq?byReq.get(String(legacyReq._id)):null;
    if(legacySub&&submissionSatisfies(requirement,legacySub)){
      return{requirement,submission:{...legacySub,inheritedFromLegacy:true,sourceRequirementId:legacyReq._id}};
    }
    return{requirement,submission:null};
  });
  return{requirements,submissions,checklist};
}

async function syncConfiguredEvidence({context,farmerId,user,stages=[],proofs={},geo,notes='Submitted from Agency field workflow.'}){
  if(!context?.companyId||!farmerId)return{requirements:[],synced:[]};
  const requirements=await getStageRequirements({companyId:context.companyId,programId:context.programId,stages});
  const synced=[];
  for(const requirement of requirements){
    const proof=proofForRequirement(requirement,proofs);
    const files=normalizeProofFiles(proof);
    if(!files.length)continue;
    const min=Math.max(0,Number(requirement.minFiles||1));
    if(requirement.required&&files.length<min)continue;
    const item=await EvidenceSubmission.findOneAndUpdate(
      {companyId:context.companyId,farmerId,requirementId:requirement._id},
      {$set:{
        workPackageId:context.workPackageId,
        agencyId:context.agencyId,
        stage:requirement.stage,
        status:'SUBMITTED',
        files:files.map(x=>({...x,...(geo?{geo}:{} )})),
        captureGeo:geo,
        submittedByLegacyUser:user?._id,
        verifiedBy:null,
        verifiedAt:null,
        notes,
      }},
      {upsert:true,new:true,setDefaultsOnInsert:true}
    );
    synced.push(item);
  }
  return{requirements,synced};
}

async function requiredEvidenceState({context,farmerId,stages=[]}){
  const state=await getEvidenceChecklist({companyId:context?.companyId,programId:context?.programId,farmerId,stages});
  if(!state.requirements.length)return{configured:false,requirements:[],submissions:[],missing:[]};
  const missing=state.checklist.filter(({requirement,submission})=>requirement.required&&!submissionSatisfies(requirement,submission)).map(({requirement})=>requirement);
  return{configured:true,requirements:state.requirements,submissions:state.submissions,checklist:state.checklist,missing};
}

module.exports={
  getStageRequirements,
  getEvidenceChecklist,
  syncConfiguredEvidence,
  requiredEvidenceState,
  proofForRequirement,
  governRequirements,
  isLegacyDefault,
  submissionSatisfies,
};
