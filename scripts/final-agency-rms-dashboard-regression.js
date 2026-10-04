const fs=require('fs');const path=require('path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const ops=read('services/api/controllers/platform/operationsController.js');
const rms=read('services/api/controllers/rmsController.js');
const prime=read('services/api/scripts/primeDemoRms.js');
const engine=read('services/api/utils/rmsEngine.js');
const adapter=read('services/api/rms/adapters/demoAdapter.js');
const agencyUi=read('apps/agency-web/src/components/AgencyRmsPanel.jsx');
const agencyCss=read('apps/agency-web/src/agency-professional.css');
const ui=read('apps/platform-web/src/features/company/operations/OperationsPages.jsx');
const rmsUi=read('apps/platform-web/src/features/company/rms/RmsPages.jsx');
const css=read('apps/platform-web/src/styles/index.css');
const checks=[
 ['dashboard API exposes ranked agencies',/topAgencies/.test(ops)&&/completionPercent\*\.65/.test(ops)&&/surveyPercent\*\.25/.test(ops)],
 ['dashboard renders top agency ranking',/Top agency performance/.test(ui)&&/agency-score-ring/.test(ui)&&/topAgencies\.slice\(0,5\)/.test(ui)],
 ['ranking explains score weights',/65% installation completion/.test(ui)&&/25% survey coverage/.test(ui)],
 ['ranking responsive styles exist',/agency-rank-list/.test(css)&&/@media\(max-width:430px\)/.test(css)],
 ['RMS aggregation scope casts tenant identifiers to ObjectId',/const objectIds=/.test(rms)&&/new mongoose\.Types\.ObjectId/.test(rms)&&/companyFilter=req=>\(\{companyId:\{\$in:objectIds/.test(rms)],
 ['RMS alerts expose affected subsystem diagnosis',/affectedSubsystem/.test(rms)&&/Controller \/ Inverter/.test(rms)&&/Pump \/ Motor \/ Water source/.test(rms)],
 ['RMS device detail exposes installed component diagnostics',/buildSystemDiagnostics/.test(rms)&&/components:diagnostics\.components/.test(rms)&&/Installed system components/.test(rmsUi)],
 ['RMS overview supports device drill-down navigation',/deviceId:a\.deviceId\?\._id/.test(rmsUi)&&/opsynq\.dashboard\.filter\.rms-live-assets/.test(rmsUi)],
 ['RMS browser cache version invalidates stale zero summaries',/RMS_CACHE_VERSION='scope-v5-fast-assets'/.test(rmsUi)],
 ['RMS overview has persisted telemetry fallback',/hasDemoProvider/.test(rms)&&/RmsTelemetry\.aggregate/.test(rms)&&/metricSamples/.test(rms)],
 ['RMS prime rejects zero-only demo output',/demo RMS operating output is unexpectedly zero/.test(prime)&&/RmsCurrentState\.aggregate/.test(prime)],
 ['RMS reconciles every beneficiary context',/BeneficiaryContext\.find\(\{companyId\}\)/.test(engine)&&/RMS demo coverage is incomplete/.test(prime)],
 ['early-stage demo beneficiaries retain non-zero standby telemetry',/STANDBY/.test(engine)&&/STANDBY/.test(adapter)&&/energyTodayKwh:5\.6/.test(adapter)],
 ['device listings expose per-record daily output',/Today output/.test(agencyUi)&&/energyTodayKwh/.test(agencyUi)&&/waterDischargeLitres/.test(agencyUi)],
 ['Agency backoffice no longer reserves hidden-navbar whitespace',/\.crm-app \.agency-sidebar\{top:0!important/.test(agencyCss)&&/padding-top:8px!important/.test(agencyCss)],
 ['Agency button contrast is normalized',/\.crm-app \.btn-secondary\{background:#46574f/.test(agencyCss)&&/\.crm-app \.btn-warning\{background:#fff5dd/.test(agencyCss)&&/\.crm-app \.btn-info\{background:#edf4f1/.test(agencyCss)]
];
let bad=0;for(const [name,ok] of checks){console.log(`${ok?'✓':'✗'} ${name}`);if(!ok)bad++;}if(bad)process.exit(1);console.log('✓ Final agency ranking + RMS demo regression passed');
