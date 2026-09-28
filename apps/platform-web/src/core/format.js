export const fmt=n=>Number(n||0).toLocaleString();
export const fmtMoney=n=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(Number(n||0));
export const get=(obj,path)=>path.split('.').reduce((a,k)=>a?.[k],obj);
