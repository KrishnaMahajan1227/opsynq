const base = process.env.OPSYNQ_API_URL || 'http://localhost:3000';
const demoPassword = String(process.env.DEMO_LOGIN_PASSWORD || '');
if (!demoPassword) {
  console.error('DEMO_LOGIN_PASSWORD is required as a process/session variable for login verification. No credential is hardcoded.');
  process.exit(2);
}

const companyAccounts = [
  ['9000000001','company_owner'],['9000000002','company_admin'],['9000000003','operations_manager'],['9000000004','inventory_manager'],['9000000005','logistics_manager'],['9000000006','quality_user'],['9000000007','finance_user'],['9000000008','viewer'],
  ['9100000001','company_owner'],['9100000002','company_admin'],['9100000003','operations_manager'],['9100000004','inventory_manager'],['9100000005','quality_user'],
];
const agencyAccounts = [
  ['9200000001','superadmin'],['9200000002','admin'],['9200000003','field_technician'],['9200000004','field_technician'],
  ['9300000001','superadmin'],['9300000002','admin'],['9300000003','field_technician'],['9300000004','field_technician'],
  ['9400000001','superadmin'],['9400000002','admin'],['9400000003','field_technician'],
];

async function request(path, options = {}, expected = [200]) {
  const res = await fetch(`${base}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    signal: options.signal || AbortSignal.timeout(15000),
  });
  const text = await res.text();
  let body = {};
  try { body = text ? JSON.parse(text) : {}; } catch { body = { raw: text }; }
  if (!expected.includes(res.status)) throw new Error(`${path}: ${res.status} ${body.message || body.error || 'request failed'}`);
  return { body, status: res.status };
}
const auth = token => ({ Authorization: `Bearer ${token}` });

async function login(identifier) {
  return (await request('/api/unified-auth/login', { method: 'POST', body: JSON.stringify({ identifier, password: demoPassword }) })).body;
}

async function verifyCompanyAccounts() {
  const sessions = new Map();
  for (const [identifier, role] of companyAccounts) {
    const session = await login(identifier);
    if (session.realm !== 'platform' || session.user?.role !== role || !session.token) throw new Error(`Company login mismatch for ${identifier}: expected ${role}`);
    const me = (await request('/api/platform/auth/me', { headers: auth(session.token) })).body;
    if (me.user?.role !== role) throw new Error(`Company /me mismatch for ${identifier}`);
    sessions.set(identifier, session);
  }
  console.log(`✓ ${companyAccounts.length} Company demo accounts authenticated with expected roles`);
  return sessions;
}

async function verifyCompanyModules(sessions) {
  const probes = [
    ['9000000002','/api/platform/operations/dashboard','Company dashboard'],
    ['9000000003','/api/platform/operations/portfolio','Operations portfolio'],
    ['9000000004','/api/platform/inventory/items?page=1&limit=2','Inventory items'],
    ['9000000005','/api/platform/logistics/shipments?page=1&limit=2','Logistics shipments'],
    ['9000000006','/api/platform/regulatory/pdi?page=1&limit=2','Quality/PDI'],
    ['9000000007','/api/platform/assurance/action-center','Finance-visible assurance'],
    ['9000000008','/api/platform/operations/dashboard','Viewer read access'],
    ['9000000002','/api/platform/regulatory/reports','Reports catalog'],
    ['9000000002','/api/rms/overview','RMS overview'],
  ];
  for (const [identifier,path,label] of probes) {
    const session=sessions.get(identifier); await request(path,{headers:auth(session.token)}); console.log(`✓ ${label}`);
  }
  const viewer=sessions.get('9000000008');
  await request('/api/platform/operations/programs',{method:'POST',headers:auth(viewer.token),body:JSON.stringify({name:'forbidden-probe'})},[403]);
  console.log('✓ Viewer write boundary enforced');
}

async function verifyAgencyAccounts() {
  const sessions = [];
  for (const [identifier, role] of agencyAccounts) {
    const loginResult = await login(identifier);
    if (loginResult.realm !== 'agency' || loginResult.user?.role !== role || !loginResult.handoffCode) throw new Error(`Agency login mismatch for ${identifier}: expected ${role}`);
    const exchange = (await request('/api/unified-auth/agency-handoff/exchange', { method: 'POST', body: JSON.stringify({ code: loginResult.handoffCode }) })).body;
    if (exchange.user?.role !== role || !exchange.token) throw new Error(`Agency handoff mismatch for ${identifier}`);
    sessions.push({identifier,role,token:exchange.token});
  }
  console.log(`✓ ${agencyAccounts.length} Agency/Admin/Technician demo accounts authenticated`);
  return sessions;
}

async function verifyAgencyScopes(sessions) {
  let techVisible=0, adminVisible=0;
  for (const session of sessions) {
    const farmers=(await request('/api/farmers',{headers:auth(session.token)})).body;
    const list=Array.isArray(farmers)?farmers:(farmers.farmers||farmers.data||[]);
    if (session.role==='field_technician') techVisible += list.length;
    else adminVisible += list.length;
    if (!Array.isArray(list)) throw new Error(`Agency farmer response invalid for ${session.identifier}`);
  }
  if (!adminVisible) throw new Error('Agency Admin/Superadmin accounts cannot see any scoped demo beneficiary.');
  if (!techVisible) throw new Error('Field Technician accounts cannot see any assigned demo beneficiary.');
  console.log(`✓ Agency/Technician beneficiary scoping returns demo data (admin rows=${adminVisible}, technician rows=${techVisible})`);
}

async function verifyHandoffReplay() {
  const first=await login('9200000001');
  await request('/api/unified-auth/agency-handoff/exchange',{method:'POST',body:JSON.stringify({code:first.handoffCode})});
  await request('/api/unified-auth/agency-handoff/exchange',{method:'POST',body:JSON.stringify({code:first.handoffCode})},[401]);
  console.log('✓ One-time agency handoff replay protection');
}

async function verifyAi(companySession) {
  const headers=auth(companySession.token);
  const status=(await request('/api/platform/ai/status',{headers})).body;
  if (!status.configured) throw new Error('AI is not configured on the API service. Move GEMINI_API_KEY/AI_MODEL to services/api/.env.');
  console.log(`✓ AI server credential configured${status.verified?' and live-verified':' (status check could not live-verify; running a brief next)'}`);
  const brief=(await request('/api/platform/ai/brief',{method:'POST',headers,body:JSON.stringify({page:'company-overview',scope:'EXECUTIVE',question:'Give a concise operational demo readiness brief using only current company facts.'})},[200])).body;
  if (!brief.brief?.executiveSummary) throw new Error('AI brief returned no executive summary.');
  console.log('✓ AI Operations generated a live company-scoped brief');
}

async function run() {
  console.log(`Checking Opsynq client-demo readiness at ${base}`);
  const health=(await request('/api/health/ready')).body;if(!health.ok)throw new Error('Backend is not ready.');
  console.log('✓ Backend ready');
  const companySessions=await verifyCompanyAccounts();
  await verifyCompanyModules(companySessions);
  const agencySessions=await verifyAgencyAccounts();
  await verifyAgencyScopes(agencySessions);
  await verifyHandoffReplay();
  await verifyAi(companySessions.get('9000000002'));
  console.log('✓ Opsynq end-to-end demo verification passed');
}
run().catch(error=>{console.error(`✗ Demo verification failed: ${error.message}`);process.exit(1)});
