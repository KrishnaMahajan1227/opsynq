const checks=[
 {name:'Backend live',url:'http://localhost:3000/api/health/live',ok:[200]},
 {name:'Backend ready',url:'http://localhost:3000/api/health/ready',ok:[200]},
 {name:'Platform Web',url:'http://localhost:5173',ok:[200]},
 {name:'Agency Web',url:'http://localhost:5174',ok:[200]},
 {name:'Protected readiness API',url:'http://localhost:3000/api/platform/readiness/company',ok:[401]},
 {name:'Protected company API',url:'http://localhost:3000/api/platform/companies',ok:[401,403]},
];
(async()=>{console.log('\nOpsynq Phase 18 local UAT\n');let failed=0;for(const c of checks){try{const r=await fetch(c.url,{signal:AbortSignal.timeout(7000)});const pass=c.ok.includes(r.status);console.log(`${pass?'✓':'✗'} ${c.name.padEnd(25)} HTTP ${r.status} (expected ${c.ok.join('/')})`);if(!pass)failed++;}catch(e){console.log(`✗ ${c.name.padEnd(25)} not reachable (${e.message})`);failed++;}}console.log(failed?`\n${failed} UAT check(s) failed. Fix them before release.\n`:'\nAll local Phase 18 UAT checks passed.\n');process.exitCode=failed?1:0})();
