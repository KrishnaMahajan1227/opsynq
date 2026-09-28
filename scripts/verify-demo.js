const base = process.env.OPSYNQ_API_URL || 'http://localhost:3000';
const demoPassword = process.env.DEMO_DEFAULT_PASSWORD || 'Demo@1234';

async function request(path, options = {}) {
  const res = await fetch(`${base}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${path}: ${res.status} ${body.message || 'request failed'}`);
  return body;
}

async function run() {
  console.log(`Checking Opsynq unified demo at ${base}`);
  const health = await request('/api/health/ready');
  if (!health.ok) throw new Error('Backend is not ready.');
  console.log('✓ Backend ready');

  const company = await request('/api/unified-auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier: '9000000002', password: demoPassword }),
  });
  if (company.realm !== 'platform' || company.user?.role !== 'company_admin') throw new Error('Unified Company login returned unexpected realm/role.');
  console.log('✓ Unified Company Admin login');

  const agencyLogin = await request('/api/unified-auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier: '9200000001', password: demoPassword }),
  });
  if (agencyLogin.realm !== 'agency' || !agencyLogin.handoffCode) throw new Error('Unified Agency login did not return a secure handoff.');
  console.log('✓ Unified Agency login issued secure one-time handoff');

  const agency = await request('/api/unified-auth/agency-handoff/exchange', {
    method: 'POST',
    body: JSON.stringify({ code: agencyLogin.handoffCode }),
  });
  if (agency.user?.role !== 'superadmin') throw new Error('Agency handoff returned unexpected role.');
  console.log('✓ Agency handoff exchanged successfully');

  let replayBlocked = false;
  try {
    await request('/api/unified-auth/agency-handoff/exchange', { method: 'POST', body: JSON.stringify({ code: agencyLogin.handoffCode }) });
  } catch { replayBlocked = true; }
  if (!replayBlocked) throw new Error('Agency handoff replay was not blocked.');
  console.log('✓ One-time handoff replay protection');

  const farmers = await request('/api/farmers', { headers: { Authorization: `Bearer ${agency.token}` } });
  const list = Array.isArray(farmers) ? farmers : farmers.farmers || farmers.data || [];
  const demo = list.find((f) => String(f.beneficiaryId || '').startsWith('OPS-DM-'));
  if (!demo?._id) throw new Error('No demo beneficiary visible to Agency Operations.');
  console.log(`✓ Demo beneficiary visible: ${demo.beneficiaryId}`);

  const detail = await request(`/api/farmers/detail-context/${demo._id}`, { headers: { Authorization: `Bearer ${agency.token}` } });
  if (!detail.context) throw new Error('Demo beneficiary is missing Opsynq assignment context.');
  console.log(`✓ Agency beneficiary context: ${detail.context.workPackageId?.code || 'mapped'}`);

  console.log('✓ Opsynq unified demo verification passed');
}

run().catch((error) => {
  console.error(`✗ Demo verification failed: ${error.message}`);
  process.exit(1);
});
