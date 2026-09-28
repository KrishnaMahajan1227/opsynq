import React,{useEffect,useMemo,useState}from'react';
import{ArrowRight,Boxes,CheckCircle2,CircleAlert,ClipboardCheck,PackageOpen,ShoppingCart,Truck,UsersRound,Warehouse}from'lucide-react';
import{api,invPath,logPath}from'../../../core/api';
import{fmt}from'../../../core/format';
import{PageHeader,Status}from'../../../components/common';
import{roleModuleIds}from'../../../layout/moduleRegistry';

const sections=[
 {id:'procurement',title:'Procurement & Receiving',text:'Create purchase orders, receive material and complete incoming quality checks.',icon:ShoppingCart,items:[['procurement','Purchase Orders & GRN'],['procurement-intelligence','Procurement Intelligence'],['pdi','PDI & Asset Inspection']]},
 {id:'inventory',title:'Inventory & Warehousing',text:'Maintain item masters, warehouse balances, transfers and serial traceability.',icon:Warehouse,items:[['item-master','Item Master'],['warehouses','Warehouses'],['stock','Warehouse Stock & Transfers'],['scanner','Barcode / Serial Scan']]},
 {id:'dispatch',title:'Dispatch & Delivery',text:'Plan shipments, assign fleet, monitor ETA and close agency delivery.',icon:Truck,items:[['shipments','Dispatch & Shipment Tracking'],['fleet','Drivers & Vehicles'],['logistics-overview','Dispatch Overview']]},
 {id:'field',title:'Agency & Field Custody',text:'Agency material footprint, receipt accountability, technician issue and final beneficiary installation.',icon:PackageOpen,items:[['agency-stock','Agency Material Accountability'],['material-issues','Technician Material Custody'],['installed-assets','Installed Assets'],['reconciliation','Reconciliation']]}
];

const Metric=({label,value,help,onClick})=>{
 const Tag=onClick?'button':'article';
 return <Tag type={onClick?'button':undefined} className={onClick?'supply-metric supply-metric--clickable':'supply-metric'} onClick={onClick}><small>{label}</small><strong>{fmt(value)}</strong><span>{help}</span>{onClick&&<ArrowRight size={14}/>}</Tag>;
};

export function SupplyChainWorkspace({companyId,onNavigate,user}){
 const[inv,setInv]=useState(null),[log,setLog]=useState(null),[tower,setTower]=useState(null),[error,setError]=useState('');
 useEffect(()=>{let live=true;Promise.all([api(invPath(companyId,'/dashboard')),api(logPath(companyId,'/dashboard')),api(logPath(companyId,'/control-tower'))]).then(([a,b,c])=>{if(live){setInv(a);setLog(b);setTower(c)}}).catch(e=>live&&setError(e.message));return()=>{live=false}},[companyId]);
 const status=useMemo(()=>Object.fromEntries((tower?.status||[]).map(x=>[x._id,x.count])),[tower]);
 const activeDeliveries=Number(status.DISPATCHED||0)+Number(status.IN_TRANSIT||0)+Number(status.PARTIAL||0);
 const exceptions=Number(log?.exceptions||0)+Number(log?.openMaterialIssues||0);
 const allowed=useMemo(()=>new Set(roleModuleIds(user?.role)),[user?.role]);
 const attention=[
  {label:'Low stock positions',value:Number(inv?.lowStock||0),help:'Review replenishment before allocation',target:'stock',filter:{health:'LOW'}},
  {label:'Deliveries beyond ETA',value:Number(tower?.overdue||0),help:'Shipment follow-up required',target:'shipments',filter:{overdue:'true'}},
  {label:'Receipt / route exceptions',value:Number(log?.exceptions||0),help:'Damaged, missing or route attention',target:'shipments',filter:{attention:'true'}},
  {label:'Open technician custody issues',value:Number(log?.openMaterialIssues||0),help:'Field material reconciliation required',target:'material-issues',filter:{status:'OPEN'}}
 ].filter(x=>x.value>0);
 return <div className="supply-control-page">
  <PageHeader eyebrow="SUPPLY CHAIN" title="Supply Chain Control" text="Manage procurement, inventory, dispatch and field custody through one connected operating flow. Open a work area only when you need to act on it."/>
  {error&&<div className="alert error">{error}</div>}

  <section className="supply-flow" aria-label="Supply chain operating flow">
   <div><span>1</span><b>Procure</b><small>PO & supplier</small></div><i>→</i>
   <div><span>2</span><b>Receive</b><small>GRN & PDI</small></div><i>→</i>
   <div><span>3</span><b>Store</b><small>Warehouse stock</small></div><i>→</i>
   <div><span>4</span><b>Dispatch</b><small>Fleet & shipment</small></div><i>→</i>
   <div><span>5</span><b>Receive at agency</b><small>Receipt accountability</small></div><i>→</i>
   <div><span>6</span><b>Issue & install</b><small>Technician / beneficiary</small></div>
  </section>

  <div className="supply-metrics">
   <Metric label="Open purchase orders" value={inv?.openPurchaseOrders} help="Awaiting full receipt or closure" onClick={()=>onNavigate?.('procurement',{__supplyDrill:true})}/>
   <Metric label="On-hand inventory" value={inv?.onHand} help={`${fmt(inv?.lowStock)} low-stock position(s)`} onClick={()=>onNavigate?.('stock',{__supplyDrill:true})}/>
   <Metric label="Active deliveries" value={activeDeliveries} help={`${fmt(tower?.overdue)} beyond ETA`} onClick={()=>onNavigate?.('shipments',{__supplyDrill:true,status:'IN_TRANSIT'})}/>
   <Metric label="Operational exceptions" value={exceptions} help="Transit, receipt or field custody attention" onClick={()=>onNavigate?.('logistics-overview',{__supplyDrill:true})}/>
  </div>

  <section className="supply-section-block">
   <div className="section-title-row"><div><span>WORK AREAS</span><h2>Open the stage you need</h2><p>Each area owns a distinct part of the material lifecycle. Records remain linked across stages.</p></div></div>
   <div className="supply-folder-grid supply-folder-grid--clean">
    {sections.map(section=><article className="supply-folder" key={section.id}>
     <div className="supply-folder-head"><span className="folder-icon"><section.icon size={19}/></span><div><h2>{section.title}</h2><p>{section.text}</p></div></div>
     <div className="supply-folder-links">{section.items.filter(([id])=>allowed.has(id)).map(([id,label])=><button key={id} onClick={()=>onNavigate?.(id,{__supplyDrill:true})}><span>{label}</span><ArrowRight size={14}/></button>)}</div>
    </article>)}
   </div>
  </section>

  <div className="supply-bottom-grid">
   <section className="panel supply-attention-panel">
    <div className="panel-head"><div><h2>Needs attention</h2><p>Only exceptions that currently require an operational decision.</p></div></div>
    {attention.length?<div className="attention-list">{attention.map(x=><button key={x.label} onClick={()=>onNavigate?.(x.target,{...x.filter,__supplyDrill:true})}><CircleAlert size={16}/><span><b>{x.label}</b><small>{x.help}</small></span><strong>{fmt(x.value)}</strong><ArrowRight size={14}/></button>)}</div>:<div className="supply-clear-state"><CheckCircle2 size={20}/><div><b>No immediate supply-chain exceptions</b><small>Current inventory, delivery and custody signals are within normal operating range.</small></div></div>}
   </section>

   <section className="panel supply-capacity-panel">
    <div className="panel-head"><div><h2>Dispatch capacity</h2><p>Current resources available before assigning the next shipment.</p></div><button className="btn secondary small" onClick={()=>onNavigate?.('fleet',{__supplyDrill:true,availability:'AVAILABLE'})}>Open fleet</button></div>
    <div className="capacity-list"><div><UsersRound size={17}/><span><b>{fmt(log?.availableDrivers)} drivers available</b><small>Not assigned to an active delivery</small></span></div><div><Truck size={17}/><span><b>{fmt(log?.availableVehicles)} vehicles available</b><small>Available for dispatch planning</small></span></div><div><ClipboardCheck size={17}/><span><b>{fmt(log?.inTransit)} shipments in transit</b><small>Currently moving through the network</small></span></div></div>
   </section>
  </div>

  <section className="table-panel supply-recent-table"><div className="panel-head padded"><div><h2>Recent dispatch activity</h2><p>Latest shipment movement only. Open a record for tracking, receipt or exception actions.</p></div><button className="btn secondary small" onClick={()=>onNavigate?.('shipments',{__supplyDrill:true})}>View all dispatches</button></div><div className="table-wrap"><table><thead><tr><th>Shipment</th><th>Agency</th><th>Work Package</th><th>Driver / Vehicle</th><th>Status</th><th>Last updated</th></tr></thead><tbody>{(log?.recentShipments||[]).slice(0,8).map(x=><tr className="clickable-row" key={x._id} onClick={()=>onNavigate?.('shipments',{q:x.shipmentNo,__supplyDrill:true})}><td><b>{x.shipmentNo}</b></td><td>{x.agencyId?.name||'Internal transfer'}</td><td>{x.workPackageId?.code||'—'}<small>{x.workPackageId?.name||''}</small></td><td>{x.driverId?.name||'Unassigned'}<small>{x.vehicleId?.registrationNo||''}</small></td><td><Status value={x.status}/></td><td>{x.updatedAt?new Date(x.updatedAt).toLocaleString():'—'}</td></tr>)}{!log?.recentShipments?.length&&<tr><td colSpan="6" className="empty">No shipment activity yet.</td></tr>}</tbody></table></div></section>
 </div>;
}
