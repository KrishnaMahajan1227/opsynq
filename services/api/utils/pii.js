function maskTail(value,visible=4,label='••••'){
 const raw=String(value||'').replace(/\s+/g,'');if(!raw)return'';const tail=raw.slice(-visible);return `${label}${tail}`;
}
function redactFarmer(value){
 if(!value)return value;const obj=typeof value.toObject==='function'?value.toObject():{...value};
 if(obj.aadharNo){obj.aadharLast4=String(obj.aadharNo).replace(/\D/g,'').slice(-4);obj.aadharNo=obj.aadharLast4?`XXXX-XXXX-${obj.aadharLast4}`:'MASKED';}
 return obj;
}
module.exports={maskTail,redactFarmer};
