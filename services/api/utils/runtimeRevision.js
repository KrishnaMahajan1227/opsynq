const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const root=path.resolve(__dirname,'../../..');
const ignore=new Set(['node_modules','.git','uploads','demo-media','dist','build','.vite']);
let cache={at:0,revision:null};
function latestMtime(dir){let latest=0;let entries=[];try{entries=fs.readdirSync(dir,{withFileTypes:true})}catch{return 0}for(const ent of entries){if(ignore.has(ent.name))continue;const full=path.join(dir,ent.name);try{if(ent.isDirectory())latest=Math.max(latest,latestMtime(full));else if(/\.(js|jsx|json|css|html|md|mjs|cjs)$/.test(ent.name))latest=Math.max(latest,fs.statSync(full).mtimeMs)}catch{}}return latest;}
function getRevision(){const now=Date.now();if(cache.revision&&now-cache.at<5000)return cache.revision;const release=process.env.RELEASE_ID||process.env.COMMIT_SHA||process.env.GIT_COMMIT||'';const mtime=latestMtime(root);const raw=`${release}|${mtime}|${process.env.NODE_ENV||'development'}`;cache={at:now,revision:crypto.createHash('sha1').update(raw).digest('hex').slice(0,16)};return cache.revision;}
module.exports={getRevision};
