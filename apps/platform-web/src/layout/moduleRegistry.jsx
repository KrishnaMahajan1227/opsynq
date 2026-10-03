import {
  Activity,ArrowRightLeft,BarChart3,Bell,Boxes,Building2,CheckCircle2,CircleAlert,ClipboardCheck,
  FileText,History,Home,Layers3,Navigation,PackageCheck,PackageOpen,PackagePlus,ScanLine,ShieldCheck,
  ShoppingCart,Truck,UploadCloud,UsersRound,Warehouse,UserCog,Wrench,WalletCards,BriefcaseBusiness,MapPin,BrainCircuit,RadioTower,Settings2
} from 'lucide-react';

export const platformGroups=[
  {id:'platform',label:'Platform',icon:Layers3,items:[
    {id:'overview',label:'Overview',icon:Layers3,keywords:'dashboard global control tower'},
    {id:'companies',label:'Companies',icon:Building2,keywords:'organizations tenants company directory'},
    {id:'approvals',label:'Approvals',icon:ClipboardCheck,keywords:'registration company approval requests'},
    {id:'system-status',label:'System Status',icon:Activity,keywords:'health readiness api database version runtime'}
  ]}
];

const ALL_COMPANY=['company_owner','company_admin'];
const ROLE_MODULES={
  company_owner:'*',
  company_admin:'*',
  operations_manager:[
    'my-workspace','ai-operations','action-center','company-overview','supply-chain','rms-overview','rms-live-assets','rms-alerts','rms-health','rms-performance','rms-map','rms-commissioning','rms-mapping',
    'programs','work-orders','work-packages','agencies','beneficiary-records','beneficiary-imports','geo-operations',
    'logistics-overview','shipments','material-issues','agency-stock',
    'installed-assets','service-cases','service-plans',
    'sla','agency-performance','compliance','approval-center',
    'analytics','notifications','documents','automation','readiness','evidence-control','regulatory-reports'
  ],
  program_manager:[
    'my-workspace','ai-operations','company-overview','rms-overview','rms-live-assets','rms-alerts','rms-health','rms-performance','rms-map','rms-commissioning','rms-mapping',
    'programs','contracts','work-orders','work-packages','agencies','beneficiary-records','beneficiary-imports','geo-operations',
    'financial-control','claims','sla','agency-performance','compliance',
    'analytics','notifications','documents','audit','readiness','evidence-control','regulatory-reports'
  ],
  inventory_manager:[
    'my-workspace','ai-operations','company-overview','supply-chain',
    'inventory-overview','item-master','warehouses','stock','procurement-intelligence','logistics-overview','shipments','material-issues','agency-stock',
    'reconciliation','pdi','analytics','notifications','documents','readiness'
  ],
  procurement_manager:[
    'my-workspace','ai-operations','company-overview','supply-chain',
    'item-master','warehouses','procurement','procurement-intelligence','stock','pdi',
    'analytics','notifications','documents'
  ],
  finance_user:[
    'my-workspace','ai-operations','company-overview','financial-control','claims','insurance','regulatory-reports','analytics','notifications','documents','audit'
  ],
  quality_user:[
    'my-workspace','rms-overview','rms-live-assets','rms-alerts','rms-health','rms-performance','rms-map','rms-commissioning','rms-mapping','ai-operations','company-overview','action-center','beneficiary-records','geo-operations',
    'installed-assets','asset-lifecycle','service-cases','service-plans','reconciliation',
    'sla','agency-performance','compliance','insurance','pdi','regulatory-reports',
    'analytics','notifications','documents','audit','readiness','evidence-control'
  ],
  logistics_manager:[
    'my-workspace','ai-operations','company-overview','supply-chain',
    'warehouses','stock','logistics-overview','shipments','fleet','material-issues','agency-stock',
    'reconciliation','analytics','notifications','documents','readiness'
  ],
  viewer:[
    'my-workspace','company-overview','rms-overview','rms-live-assets','rms-health','rms-performance','rms-map','analytics','notifications','documents'
  ]
};

const rolesFor=id=>Object.entries(ROLE_MODULES).filter(([,mods])=>mods==='*'||mods.includes(id)).map(([role])=>role);
const item=(id,label,icon,keywords,manageCapability)=>({id,label,icon,keywords,manageCapability,roles:rolesFor(id)});

export const companyGroups=[
  {id:'workspace',label:'Workspace',icon:Home,items:[
    item('company-overview','Dashboard',Activity,'dashboard command overview health attention'),
    item('my-workspace','My Workspace',Home,'home favorites pinned recent modules shortcuts')
  ]},
  {id:'intelligence',label:'AI Operations',icon:BrainCircuit,items:[
    item('ai-operations','Operations Intelligence',BrainCircuit,'automated monitoring proposals decision support risk recommendations approvals')
  ]},
  {id:'delivery',label:'Agency Operations',icon:BriefcaseBusiness,items:[
    item('programs','Delivery Portfolio',Layers3,'program contract loa work order work package delivery hierarchy scheme project','operations.write'),
    item('agencies','Agencies',UsersRound,'agency implementation partner','operations.write'),
    item('beneficiary-records','Beneficiary Records',UsersRound,'farmer beneficiary records details photos status'),
    item('geo-operations','Geo Operations',MapPin,'map geography sites survey installation complaint location geotag'),
    item('beneficiary-imports','Beneficiary Imports',UploadCloud,'farmer beneficiary excel bulk import','operations.write'),
    item('agency-performance','Agency Performance',BarChart3,'agency scorecard performance survey coverage completion exceptions')
  ]},
  {id:'supply-chain',label:'Supply Operations',icon:Truck,items:[
    item('supply-chain','Supply Chain Control',Truck,'procurement inventory warehouse dispatch shipment driver vehicle agency technician material custody control tower'),
    item('procurement','Procurement & GRN',ShoppingCart,'purchase order supplier goods receipt procurement','procurement.write'),
    item('stock','Warehouse Stock',ArrowRightLeft,'inventory stock balance warehouse transfer','inventory.write'),
    item('shipments','Dispatch Tracking',Navigation,'dispatch shipment delivery tracking agency','logistics.write'),
    item('fleet','Fleet & Capacity',UsersRound,'driver vehicle availability workload fleet','logistics.write')
  ]},

  {id:'rms',label:'RMS Monitoring',icon:RadioTower,items:[
    item('rms-overview','Overview',RadioTower,'rms remote monitoring overview health telemetry'),
    item('rms-live-assets','Live Assets',Activity,'rms devices live telemetry pump status'),
    item('rms-alerts','Alerts',CircleAlert,'rms alerts faults communication'),
    item('rms-health','Device Health',ShieldCheck,'rms connectivity offline stale provider health'),
    item('rms-performance','Performance',BarChart3,'rms energy runtime water performance'),
    item('rms-map','Map',MapPin,'rms gps location map'),
    item('rms-commissioning','Commissioning',CheckCircle2,'rms commissioning first telemetry'),
    item('rms-mapping','Mapping / Reconciliation',ArrowRightLeft,'rms mapping unmapped device reconciliation','rms.manage'),
    item('rms-integrations','Integrations',Settings2,'rms provider integration settings health','rms.manage')
  ]},
  {id:'asset-care',label:'Asset Care',icon:Wrench,items:[
    item('installed-assets','Installed Assets',PackageCheck,'farmer installed serial asset','service.write'),
    item('asset-lifecycle','Asset Lifecycle',Activity,'asset history replacement return','service.write'),
    item('service-cases','Service / Warranty',CircleAlert,'complaint service breakdown warranty','service.write'),
    item('service-plans','Warranty & AMC',ShieldCheck,'amc warranty coverage plan','service.write'),
    item('reconciliation','Reconciliation',ClipboardCheck,'stock mismatch exception serial','logistics.write'),
    item('insurance','Asset Insurance',ShieldCheck,'insurance policy insurer expiry coverage claim farmer asset','insurance.write')
  ]},
  {id:'finance-assurance',label:'Finance & Assurance',icon:WalletCards,items:[
    item('sla','SLA Rules',ClipboardCheck,'sla due delayed breach','assurance.write'),
    item('financial-control','Financial Control',WalletCards,'company finance procurement commitment receivables agency commercial'),
    item('claims','Claims & Receivables',Building2,'claim payment receivable commercial','finance.write'),
    item('compliance','Quality & Compliance',ShieldCheck,'inspection compliance claim ready quality','assurance.write'),
    item('approval-center','Approval Center',CheckCircle2,'approval exception waiver','approvals.decide'),
    item('evidence-control','Evidence Control',ClipboardCheck,'survey installation final inspection evidence checklist photos documents'),
    item('regulatory-reports','Reports & Compliance',FileText,'daily weekly monthly yearly reports audit gst eway jcr installer asset imei agency regulatory export')
  ]},
  {id:'administration',label:'Administration',icon:UserCog,items:[
    item('bulk-center','Bulk & Exports',UploadCloud,'bulk import export csv excel','approvals.decide'),
    item('analytics','Analytics & Reports',BarChart3,'analytics reports metrics'),
    item('notifications','Notifications',Bell,'alerts notification'),
    item('documents','Documents',FileText,'document loa invoice grn proof'),
    item('audit','Audit Trail',History,'audit history changes'),
    item('team-access','Team & Access',UserCog,'company users roles permissions access team','team.manage'),
    item('automation','Automation & Health',Activity,'automation scheduler system health','automation.run'),
    item('master-data','Master Data',Layers3,'geography brand supplier scheme component tender field master data'),
    item('readiness','Readiness & Data Quality',ShieldCheck,'uat readiness integrity data quality validation')
  ]}
];

const hiddenDeliveryModules=[
  item('contracts','Contracts / LOA',ClipboardCheck,'contract loa tender award','operations.write'),
  item('work-orders','Work Orders',Building2,'work order execution','operations.write'),
  item('work-packages','Work Packages',PackageCheck,'allocation agency package','operations.write')
].map(x=>({...x,groupId:'delivery',groupLabel:'Agency Operations'}));
const hiddenSupplyModules=[
  item('inventory-overview','Supply Chain Overview',Boxes,'inventory dashboard stock'),
  item('item-master','Item Master',PackagePlus,'sku product material master','inventory.write'),
  item('warehouses','Warehouses',Warehouse,'warehouse location stock','inventory.write'),
  item('procurement','Purchase Orders & GRN',ShoppingCart,'purchase order po grn goods receipt','procurement.write'),
  item('procurement-intelligence','Procurement Intelligence',ShoppingCart,'ai reorder replenishment low stock forecast draft po'),
  item('stock','Warehouse Stock & Transfers',ArrowRightLeft,'inventory balance movement transfer','inventory.write'),
  item('logistics-overview','Dispatch Overview',Truck,'logistics transport dashboard'),
  item('shipments','Dispatch & Shipment Tracking',Navigation,'dispatch shipment tracking driver','logistics.write'),
  item('fleet','Drivers & Vehicles',UsersRound,'driver vehicle fleet','logistics.write'),
  item('material-issues','Technician Material Custody',PackageOpen,'technician issue custody material','logistics.write'),
  item('agency-stock','Agency Material Accountability',Truck,'agency dispatched received damaged missing stock custody'),
  item('pdi','PDI & Asset Inspection',ClipboardCheck,'pre dispatch inspection pdi serial quality supplier brand','pdi.write')
].map(x=>({...x,groupId:'supply-chain',groupLabel:'Supply Operations'}));
const hiddenCompanyModules=[...hiddenDeliveryModules,...hiddenSupplyModules,{...item('action-center','Action Center',CircleAlert,'daily operational attention exceptions approvals service claims compliance'),groupId:'workspace',groupLabel:'Workspace'}];

export const flattenModules=(companyMode=false)=>(companyMode?companyGroups:platformGroups).flatMap(g=>g.items.map(x=>({...x,groupId:g.id,groupLabel:g.label})));
export const moduleForPage=(page,companyMode=false)=>(companyMode?[...flattenModules(true),...hiddenCompanyModules]:flattenModules(false)).find(m=>m.id===page);
export const moduleVisibleToUser=(module,user,companyMode=false)=>{
  if(!module)return false;
  if(!companyMode||user?.role==='platform_superadmin')return true;
  return Array.isArray(module.roles)&&module.roles.includes(user?.role);
};
export const groupsForUser=(user,companyMode=false)=>(companyMode?companyGroups:platformGroups).map(group=>({
  ...group,
  items:group.items.filter(x=>moduleVisibleToUser(x,user,companyMode))
})).filter(group=>group.items.length);
export const flattenModulesForUser=(user,companyMode=false)=>groupsForUser(user,companyMode).flatMap(g=>g.items.map(x=>({...x,groupId:g.id,groupLabel:g.label})));
export const roleModuleIds=role=>ROLE_MODULES[role]==='*'?[...flattenModules(true),...hiddenCompanyModules].map(m=>m.id):[...(ROLE_MODULES[role]||[])];
export const defaultCompanyPageForRole=role=>({
  company_owner:'company-overview',
  company_admin:'company-overview',
  operations_manager:'company-overview',
  program_manager:'company-overview',
  inventory_manager:'company-overview',
  procurement_manager:'company-overview',
  finance_user:'company-overview',
  quality_user:'company-overview',
  logistics_manager:'company-overview',
  viewer:'company-overview'
}[role]||'my-workspace');
