const targets=[
 ['Backend live','http://localhost:3000/api/health/live'],
 ['Backend ready','http://localhost:3000/api/health/ready'],
 ['Platform Web','http://localhost:5173'],
 ['Agency Web','http://localhost:5174'],
];
(async()=>{console.log('\nOpsynq local runtime verification\n');let failed=0;for(const [name,url] of targets){try{const r=await fetch(url,{signal:AbortSignal.timeout(5000)});console.log(`${r.ok?'✓':'!'} ${name.padEnd(18)} ${url}  HTTP ${r.status}`);if(!r.ok)failed++;}catch(e){console.log(`✗ ${name.padEnd(18)} ${url}  not reachable (${e.message})`);failed++;}}console.log(failed?'\nOne or more services are not ready. Check the matching terminal output.\n':'\nAll Opsynq local services are live and ready.\n');process.exitCode=failed?1:0;})();
