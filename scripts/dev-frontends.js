const {spawn}=require('child_process');
const path=require('path');
const root=path.resolve(__dirname,'..');
const vite=path.join(root,'node_modules','vite','bin','vite.js');
const apps=[
  {name:'Platform',dir:path.join(root,'apps','platform-web'),port:'5173'},
  {name:'Agency',dir:path.join(root,'apps','agency-web'),port:'5174'},
];
const children=[];
for(const app of apps){
  const child=spawn(process.execPath,[vite,'--host','0.0.0.0','--port',app.port,'--strictPort'],{cwd:app.dir,stdio:'inherit',env:process.env});
  child.on('exit',code=>{if(code&&code!==0){console.error(`${app.name} frontend exited with code ${code}`);shutdown(code)}});
  children.push(child);
}
function shutdown(code=0){for(const c of children){if(!c.killed)c.kill()}process.exit(code)}
process.on('SIGINT',()=>shutdown(0));process.on('SIGTERM',()=>shutdown(0));
console.log('Opsynq frontends starting: Platform http://localhost:5173 · Agency http://localhost:5174');
