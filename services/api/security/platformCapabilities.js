const ALL_COMPANY_ROLES=['company_owner','company_admin','operations_manager','program_manager','inventory_manager','procurement_manager','finance_user','quality_user','logistics_manager','viewer'];
const SUPER=['platform_superadmin'];
const withSuper=roles=>[...SUPER,...roles];

const POLICY={
  'company.read':withSuper(ALL_COMPANY_ROLES),
  'overview.read':withSuper(ALL_COMPANY_ROLES),
  'operations.read':withSuper(['company_owner','company_admin','operations_manager','program_manager']),
  'beneficiary.read':withSuper(['company_owner','company_admin','operations_manager','program_manager','quality_user']),
  'inventory.read':withSuper(['company_owner','company_admin','inventory_manager','procurement_manager','logistics_manager']),
  'procurement.read':withSuper(['company_owner','company_admin','inventory_manager','procurement_manager']),
  'logistics.read':withSuper(['company_owner','company_admin','operations_manager','inventory_manager','logistics_manager']),
  'assets.read':withSuper(['company_owner','company_admin','operations_manager','quality_user']),
  'service.read':withSuper(['company_owner','company_admin','operations_manager','quality_user']),
  'finance.read':withSuper(['company_owner','company_admin','program_manager','finance_user']),
  'assurance.read':withSuper(['company_owner','company_admin','operations_manager','program_manager','quality_user']),
  'audit.read':withSuper(['company_owner','company_admin','program_manager','finance_user','quality_user']),
  'team.read':withSuper(['company_owner','company_admin']),
  'automation.read':withSuper(['company_owner','company_admin','operations_manager']),
  'ai.read':withSuper(['company_owner','company_admin','operations_manager','program_manager','inventory_manager','procurement_manager','finance_user','quality_user','logistics_manager']),
  'readiness.read':withSuper(['company_owner','company_admin','operations_manager','program_manager','inventory_manager','quality_user','logistics_manager']),
  'insurance.read':withSuper(['company_owner','company_admin','operations_manager','finance_user','quality_user']),
  'pdi.read':withSuper(['company_owner','company_admin','inventory_manager','procurement_manager','quality_user','logistics_manager']),
  'regulatory.read':withSuper(['company_owner','company_admin','operations_manager','program_manager','finance_user','quality_user']),

  'operations.write':withSuper(['company_owner','company_admin','operations_manager','program_manager']),
  'inventory.write':withSuper(['company_owner','company_admin','inventory_manager']),
  'procurement.write':withSuper(['company_owner','company_admin','inventory_manager','procurement_manager']),
  'procurement.approve':withSuper(['company_owner','company_admin']),
  'logistics.write':withSuper(['company_owner','company_admin','logistics_manager']),
  'service.write':withSuper(['company_owner','company_admin','operations_manager','quality_user']),
  'finance.write':withSuper(['company_owner','company_admin','finance_user','program_manager']),
  'governance.write':withSuper(['company_owner','company_admin']),
  'assurance.write':withSuper(['company_owner','company_admin','operations_manager','program_manager','quality_user']),
  'approvals.decide':withSuper(['company_owner','company_admin','operations_manager']),
  'automation.run':withSuper(['company_owner','company_admin','operations_manager']),
  'ai.run':withSuper(['company_owner','company_admin','operations_manager','program_manager','inventory_manager','procurement_manager','finance_user','quality_user','logistics_manager']),
  'insurance.write':withSuper(['company_owner','company_admin','finance_user','quality_user']),
  'pdi.write':withSuper(['company_owner','company_admin','inventory_manager','procurement_manager','quality_user']),
  'team.manage':withSuper(['company_owner','company_admin']),
  'platform.manage':['platform_superadmin']
};

const rolesFor=capability=>POLICY[capability]||[];
const capabilitiesForRole=role=>role==='platform_superadmin'?['*',...Object.keys(POLICY)]:Object.entries(POLICY).filter(([,roles])=>roles.includes(role)).map(([cap])=>cap);
const hasCapability=(role,capability)=>role==='platform_superadmin'||rolesFor(capability).includes(role);
module.exports={ALL_COMPANY_ROLES,POLICY,rolesFor,capabilitiesForRole,hasCapability};
