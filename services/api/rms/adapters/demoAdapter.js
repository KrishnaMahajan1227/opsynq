const DEFAULT_CAPABILITIES=['voltage','current','power','energy','runtime','waterFlow','waterDischarge','gps','signalStrength','faultCodes','historicalData'];
function telemetryFor(device,scenario='HEALTHY_RUNNING'){
 const minute=new Date().getMinutes();let payload={messageId:`${device.externalDeviceId}:${Date.now()}`,timestamp:new Date().toISOString(),pumpState:'RUNNING',dcVoltage:570+(minute%7),dcCurrent:7.2+(minute%4)/10,powerKw:4.1+(minute%3)/10,energyTodayKwh:12.5+minute*.08,runtimeTodayMinutes:180+minute,waterFlowLpm:42+(minute%5),waterDischargeLitres:12000+(minute*30),signalQuality:78,latitude:device.reportedLocation?.latitude||device.installedLocation?.latitude,longitude:device.reportedLocation?.longitude||device.installedLocation?.longitude};
 if(scenario==='COMMUNICATION_LOST')return null;
 if(scenario==='DRY_RUN')payload={...payload,pumpState:'RUNNING',powerKw:.2,waterFlowLpm:0,externalFaultCode:'DRY_RUN'};
 if(scenario==='CONTROLLER_FAULT')payload={...payload,pumpState:'STOPPED',dcCurrent:0,powerKw:0,externalFaultCode:'E104'};
 if(scenario==='LOW_PERFORMANCE')payload={...payload,powerKw:.25,waterFlowLpm:8};
 return payload;
}
module.exports={code:'DEMO-RMS',type:'DEMO_SIMULATOR',capabilities:DEFAULT_CAPABILITIES,testConnection:async()=>({ok:true}),getCapabilities:()=>DEFAULT_CAPABILITIES,fetchLatestTelemetry:async(device,scenario)=>telemetryFor(device,scenario)};
