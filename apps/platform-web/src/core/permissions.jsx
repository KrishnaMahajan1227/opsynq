import React,{createContext,useContext}from'react';
const PermissionContext=createContext({user:null,can:()=>false});
export const hasCapability=(user,capability)=>{
 if(!capability)return true;
 if(user?.role==='platform_superadmin')return true;
 const caps=Array.isArray(user?.capabilities)?user.capabilities:[];
 return caps.includes('*')||caps.includes(capability);
};
export function PermissionProvider({user,children}){return <PermissionContext.Provider value={{user,can:cap=>hasCapability(user,cap)}}>{children}</PermissionContext.Provider>}
export const usePermissions=()=>useContext(PermissionContext);
export function Can({capability,children,fallback=null}){const{can}=usePermissions();return can(capability)?children:fallback}
