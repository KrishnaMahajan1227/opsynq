import React from 'react';
import { FaChevronRight } from 'react-icons/fa';

const META={
 overview:['Operations Overview','Agency workload, delivery progress and exceptions.'],
 records:['Beneficiary Records','Search, review and manage beneficiaries assigned to this agency.'],
 'farmer-detail':['Beneficiary Record','Complete field, survey, installation and evidence context.'],
 installation:['Installation Orders','Coordinate ready, active and pending installation work.'],
 completed:['Completed Installs','Completed and closed beneficiary installations.'],
 complaints:['Complaints & Rework','Track exceptions, complaints and corrective field work.'],
 'material-receipts':['Inbound Material','Confirm company dispatch receipts, shortages and damaged material.'],
 reports:['Reports & Audit','Daily to annual agency-scoped operational, RMS, material and audit reports.'],
 rms:['RMS Monitoring','Live remote monitoring, alerts and device performance for assigned beneficiaries.'],
 'technician-summary':['Technician Performance','Team workload, completion and field accountability.'],
 users:['User Management','Manage agency users, roles and recovery access.'],
 requests:['Admin Requests','Review controlled administrative requests.'],
 upload:['Bulk Data Import','Validate and import approved operational spreadsheets.'],
};
export default function AgencyWorkspaceHeader({activeTab='overview',role='admin'}){
 const [title,desc]=META[activeTab]||['Agency Operations','Manage agency execution and field delivery.'];
 return <header className="agency-workspace-header"><div className="agency-workspace-breadcrumb"><span>Agency Operations</span><FaChevronRight/><b>{title}</b></div><div className="agency-workspace-copy"><span className="agency-workspace-eyebrow">{role==='superadmin'?'AGENCY CONTROL CENTER':'AGENCY WORKSPACE'}</span><h1>{title}</h1><p>{desc}</p></div></header>;
}
