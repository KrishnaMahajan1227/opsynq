import React,{useEffect,useMemo,useState} from 'react';
import {ArrowLeft} from 'lucide-react';
import {Shell} from '../../layout/Shell';
import {CompanyDashboard,ResourcePage,resourceConfig,WorkPackages,BeneficiaryImports,BeneficiaryRecords} from './operations/OperationsPages';
import {InventoryOverview,ItemMasterPage,WarehousesPage,ProcurementPage,StockPage,ScannerPage} from './inventory/InventoryPages';
import {ProcurementIntelligencePage,AgencyStockAccountabilityPage,FinancialControlPage} from './inventory/IntelligencePages';
import {LogisticsOverview,FleetPage,ShipmentsPage,MaterialIssuesPage,InstalledAssetsPage,AssetLifecyclePage,ReconciliationPage} from './logistics/LogisticsPages';
import {ServiceCasesPage,ServicePlansPage,SlaPage,ClaimsPage} from './service/ServicePages';
import {AnalyticsPage,NotificationsPage,DocumentsPage,AuditPage} from './governance/GovernancePages';
import {CompliancePage,AgencyPerformancePage,ApprovalCenterPage,BulkCenterPage,ActionCenterPage} from './assurance/AssurancePages';
import {InsurancePage,PDIPage,RegulatoryReportsPage} from './assurance/RegulatoryPages';
import {AutomationPage} from './system/AutomationPage';
import {MyWorkspacePage} from './system/ProductivityPage';
import {TeamAccessPage} from './system/TeamAccessPage';
import {ReadinessPage} from './system/ReadinessPage';
import {MasterDataPage,EvidenceControlPage} from './configuration/ConfigurationCenter.jsx';
import {GeoOperationsPage} from './geo/GeoOperationsPage';
import {PermissionProvider} from '../../core/accessControl.jsx';
import {defaultCompanyPageForRole,flattenModulesForUser} from '../../layout/moduleRegistry';

const pageComponents={
 'my-workspace':MyWorkspacePage,'company-overview':CompanyDashboard,'work-packages':WorkPackages,'beneficiary-records':BeneficiaryRecords,'beneficiary-imports':BeneficiaryImports,
 'inventory-overview':InventoryOverview,'item-master':ItemMasterPage,'warehouses':WarehousesPage,'procurement':ProcurementPage,'procurement-intelligence':ProcurementIntelligencePage,'agency-stock':AgencyStockAccountabilityPage,'financial-control':FinancialControlPage,'stock':StockPage,'scanner':ScannerPage,
 'logistics-overview':LogisticsOverview,'shipments':ShipmentsPage,'fleet':FleetPage,'material-issues':MaterialIssuesPage,'installed-assets':InstalledAssetsPage,'asset-lifecycle':AssetLifecyclePage,'reconciliation':ReconciliationPage,
 'service-cases':ServiceCasesPage,'service-plans':ServicePlansPage,'sla':SlaPage,'claims':ClaimsPage,'insurance':InsurancePage,'pdi':PDIPage,'regulatory-reports':RegulatoryReportsPage,
 'geo-operations':GeoOperationsPage,'action-center':ActionCenterPage,'compliance':CompliancePage,'agency-performance':AgencyPerformancePage,'approval-center':ApprovalCenterPage,'bulk-center':BulkCenterPage,
 'analytics':AnalyticsPage,'notifications':NotificationsPage,'documents':DocumentsPage,'audit':AuditPage,'team-access':TeamAccessPage,'automation':AutomationPage,'master-data':MasterDataPage,'evidence-control':EvidenceControlPage,'readiness':ReadinessPage
};
export function CompanyWorkspace({user,companyId,back,logout}){const pageKey=`opsynq_company_page:${companyId||user?.organizationId||'self'}:${user?.role||'user'}`;const deliveryKey=`opsynq.delivery.context.${companyId}`;const[page,setPageState]=useState(()=>sessionStorage.getItem(pageKey)||defaultCompanyPageForRole(user?.role));const setPage=(p,filter)=>{sessionStorage.setItem(pageKey,p);const hierarchy=['programs','contracts','work-orders','work-packages'];const isHierarchyDrill=!!filter?.__hierarchyDrill;if(hierarchy.includes(p)&&!isHierarchyDrill){try{sessionStorage.removeItem(deliveryKey)}catch{}}if(filter&&typeof filter==='object'&&!isHierarchyDrill){try{sessionStorage.setItem(`opsynq.dashboard.filter.${p}`,JSON.stringify(filter))}catch{}}setPageState(p)};const allowed=useMemo(()=>flattenModulesForUser(user,true).map(m=>m.id),[user]);const safePage=allowed.includes(page)?page:(allowed[0]||'company-overview');useEffect(()=>{if(page!==safePage)setPage(safePage)},[page,safePage]);let content;if(resourceConfig[safePage])content=<ResourcePage kind={safePage} companyId={companyId} onNavigate={setPage}/>;else{const Component=pageComponents[safePage]||CompanyDashboard;content=<Component companyId={companyId} onNavigate={setPage} user={user}/>;}return <PermissionProvider user={user}><Shell user={user} page={safePage} setPage={setPage} logout={logout} companyMode companyId={companyId}>{back&&<button className="back company-switch" onClick={back}><ArrowLeft size={16}/> Back to platform companies</button>}{content}</Shell></PermissionProvider>}
