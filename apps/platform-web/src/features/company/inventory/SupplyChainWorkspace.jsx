import React,{useEffect,useMemo,useState}from'react';
import{ArrowRight,Boxes,Building2,ClipboardCheck,PackageOpen,PackagePlus,ScanLine,ShoppingCart,Truck,UsersRound,Warehouse}from'lucide-react';
import{api,invPath,logPath}from'../../../core/api';
import{fmt}from'../../../core/format';
import{PageHeader,Status}from'../../../components/common';
import{roleModuleIds}from'../../../layout/moduleRegistry';

const sections=[
 {id:'procurement',title:'Procurement & Receiving',text:'Purchase orders, supplier commitments and GRN receiving.',icon:ShoppingCart,items:[['procurement','Purchase Orders & GRN'],['procurement-intelligence','Procurement Intelligence'],['pdi','PDI & Asset Inspection']]},
 {id:'inventory',title:'Inventory & Warehousing',text:'Item master, warehouse stock, transfers and serial traceability.',icon:Warehouse,items:[['item-master','Item Master'],['warehouses','Warehouses'],['stock','Warehouse Stock & Transfers'],['scanner','Barcode / Serial Scan']]},
 {id:'dispatch',title:'Dispatch & Delivery',text:'Plan dispatches, assign fleet, track transit and close agency receipts.',icon:Truck,items:[['shipments','Dispatch & Shipment Tracking'],['fleet','Drivers & Vehicles'],['logistics-overview','Dispatch Overview']]},
 {id:'field',title:'Agency & Field Custody',text:'Follow material from agency receipt to technician issue and installation.',icon:PackageOpen,items:[['agency-stock','Agency Material Accountability'],['material-issues','Technician Material Custody'],['installed-assets','Installed Assets'],['reconciliation','Reconciliation']]}
];

export function SupplyChainWorkspace({companyId,onNavigate,user}){
 const[inv,setInv]=useState(null),[log,setLog]=useState(null),[tower,setTower]=useState(null),[error,setError]=useState('');
 useEffect(()=>{let live=true;Promise.all([api(invPath(companyId,'/dashboard')),api(logPath(companyId,'/dashboard')),api(logPath(companyId,'/control-tower'))]).then(([a,b,c])=>{if(live){setInv(a);setLog(b);setTower(c)}}).catch(e=>live&&setError(e.message));return()=>{live=false}},[companyId]);
 const status=useMemo(()=>Object.fromEntries((tower?.status||[]).map(x=>[x._id,x.count])),[tower]);
 const exceptions=Number(log?.exceptions||0)+Number(log?.openMaterialIssues||0);
 const allowed=useMemo(()=>new Set(roleModuleIds(user?.role)),[user?.role]);
 return <>
  <PageHeader eyebrow="SUPPLY CHAIN" title="Supply Chain Control" text="One connected workspace from procurement and warehouse receipt through dispatch, agency custody, technician issue and beneficiary installation."/>
  {error&&<div className="alert error">{error}</div>}
  <div className="summary-grid supply-summary">
   <article><small>Open purchase orders</small><strong>{fmt(inv?.openPurchaseOrders)}</strong><span>Procurement commitments awaiting closure</span></article>
   <article><small>On-hand inventory</small><strong>{fmt(inv?.onHand)}</strong><span>{fmt(inv?.lowStock)} low-stock position(s)</span></article>
   <article><small>Active deliveries</small><strong>{fmt(Number(status.DISPATCHED||0)+Number(status.IN_TRANSIT||0)+Number(status.PARTIAL||0))}</strong><span>{fmt(tower?.overdue)} currently beyond ETA</span></article>
   <article><small>Operational exceptions</small><strong>{fmt(exceptions)}</strong><span>Transit, receipt or technician custody attention</span></article>
  </div>
  <section className="supply-folder-grid">
   {sections.map(section=><article className="supply-folder" key={section.id}><div className="supply-folder-head"><span className="folder-icon"><section.icon size={20}/></span><div><h2>{section.title}</h2><p>{section.text}</p></div></div><div className="supply-folder-links">{section.items.filter(([id])=>allowed.has(id)).map(([id,label])=><button key={id} onClick={()=>onNavigate?.(id,{__supplyDrill:true})}><span>{label}</span><ArrowRight size={15}/></button>)}</div></article>)}
  </section>
  <div className="dashboard-grid">
   <section className="panel"><div className="panel-head"><div><h2>Agency material footprint</h2><p>Latest company-to-agency custody position.</p></div><button className="btn secondary small" onClick={()=>onNavigate?.('agency-stock',{__supplyDrill:true})}>Open accountability</button></div><div className="linked-record-list">{(tower?.agencies||[]).slice(0,6).map(x=><button key={x._id} onClick={()=>onNavigate?.('agency-stock',{agencyId:x._id,__supplyDrill:true})}><span><b>{x.agency?.name||'Agency'}</b><small>{fmt(x.units)} dispatched · {fmt(x.received)} received · {fmt(Number(x.damaged||0)+Number(x.missing||0))} exception</small></span><ArrowRight size={15}/></button>)}{!tower?.agencies?.length&&<div className="empty">No agency dispatch history yet.</div>}</div></section>
   <section className="panel"><div className="panel-head"><div><h2>Fleet availability</h2><p>Capacity view before the next dispatch assignment.</p></div><button className="btn secondary small" onClick={()=>onNavigate?.('fleet',{__supplyDrill:true})}>Manage fleet</button></div><div className="phase-bars"><div><span><b>Drivers available</b><small>Not on active dispatch</small></span><strong>{fmt(log?.availableDrivers)}</strong></div><div><span><b>Vehicles available</b><small>Not on active dispatch</small></span><strong>{fmt(log?.availableVehicles)}</strong></div><div><span><b>In transit</b><small>Company and agency deliveries</small></span><strong>{fmt(log?.inTransit)}</strong></div><div><span><b>Receipt / route exceptions</b><small>Needs logistics attention</small></span><strong>{fmt(log?.exceptions)}</strong></div></div></section>
  </div>
  <section className="table-panel"><div className="panel-head padded"><div><h2>Recent dispatch activity</h2><p>Open a shipment to continue tracking, receipt or exception handling.</p></div><button className="btn secondary small" onClick={()=>onNavigate?.('shipments',{__supplyDrill:true})}>All dispatches</button></div><div className="table-wrap"><table><thead><tr><th>Shipment</th><th>Agency</th><th>Work Package</th><th>Fleet</th><th>Status</th><th>Updated</th></tr></thead><tbody>{(log?.recentShipments||[]).map(x=><tr className="clickable-row" key={x._id} onClick={()=>onNavigate?.('shipments',{q:x.shipmentNo,__supplyDrill:true})}><td><b>{x.shipmentNo}</b></td><td>{x.agencyId?.name||'Internal transfer'}</td><td>{x.workPackageId?.code||'—'}<small>{x.workPackageId?.name||''}</small></td><td>{x.driverId?.name||'Unassigned'}<small>{x.vehicleId?.registrationNo||''}</small></td><td><Status value={x.status}/></td><td>{x.updatedAt?new Date(x.updatedAt).toLocaleString():'—'}</td></tr>)}{!log?.recentShipments?.length&&<tr><td colSpan="6" className="empty">No shipment activity yet.</td></tr>}</tbody></table></div></section>
 </>;
}
