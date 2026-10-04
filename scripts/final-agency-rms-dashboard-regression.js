const fs=require('fs');const path=require('path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const ops=read('services/api/controllers/platform/operationsController.js');
const rms=read('services/api/controllers/rmsController.js');
const prime=read('services/api/scripts/primeDemoRms.js');
const ui=read('apps/platform-web/src/features/company/operations/OperationsPages.jsx');
const css=read('apps/platform-web/src/styles/index.css');
const checks=[
 ['dashboard API exposes ranked agencies',/topAgencies/.test(ops)&&/completionPercent\*\.65/.test(ops)&&/surveyPercent\*\.25/.test(ops)],
 ['dashboard renders top agency ranking',/Top agency performance/.test(ui)&&/agency-score-ring/.test(ui)&&/topAgencies\.slice\(0,5\)/.test(ui)],
 ['ranking explains score weights',/65% installation completion/.test(ui)&&/25% survey coverage/.test(ui)],
 ['ranking responsive styles exist',/agency-rank-list/.test(css)&&/@media\(max-width:430px\)/.test(css)],
 ['RMS overview has persisted telemetry fallback',/hasDemoProvider/.test(rms)&&/RmsTelemetry\.aggregate/.test(rms)&&/metricSamples/.test(rms)],
 ['RMS prime rejects zero-only demo output',/demo RMS operating output is unexpectedly zero/.test(prime)&&/RmsCurrentState\.aggregate/.test(prime)]
];
let bad=0;for(const [name,ok] of checks){console.log(`${ok?'✓':'✗'} ${name}`);if(!ok)bad++;}if(bad)process.exit(1);console.log('✓ Final agency ranking + RMS demo regression passed');
