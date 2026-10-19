// Read-only public deployment audit. Run after Render deploys the current commit.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.join(__dirname, '../dist');
const origin = 'https://gifts-boutique.onrender.com';
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
function files(dir) {
  return fs.readdirSync(dir, {withFileTypes:true}).flatMap(entry => entry.isDirectory() ? files(path.join(dir,entry.name)) : [path.join(dir,entry.name)]);
}
async function run() {
  const report = {checkedAt:new Date().toISOString(),origin,assets:[],exposure:[]};
  for(const file of files(root)) {
    const relative = path.relative(root,file).split(path.sep).join('/');
    const response = await fetch(`${origin}/${relative === 'index.html' ? '' : relative}`, {signal:AbortSignal.timeout(20000)});
    const bytes=Buffer.from(await response.arrayBuffer());
    const local=fs.readFileSync(file);
    const polish=response.headers.get('cf-polished') || '';
    const cdnOptimizedImage = response.headers.get('content-type') === 'image/jpeg' && polish.startsWith('ok,') && polish.includes(`orig_size=${local.length}`);
    report.assets.push({file:relative,status:response.status,type:response.headers.get('content-type'),bytes:bytes.length,matchesLocal:hash(bytes)===hash(local),cdnOptimizedImage});
    if(relative==='index.html') report.headers=Object.fromEntries(response.headers);
  }
  for(const url of ['/this-page-does-not-exist-audit','/.git/HEAD','/.env','/.openai/hosting.json','/tools/render-share-card.cjs']) {
    const response = await fetch(origin+url,{signal:AbortSignal.timeout(20000)});
    report.exposure.push({path:url,status:response.status});
    await response.arrayBuffer();
  }
  console.log(JSON.stringify(report,null,2));
  if(report.assets.some(a=>a.status!==200||(!a.matchesLocal&&!a.cdnOptimizedImage)) || report.exposure.some(a=>a.status!==404)) process.exitCode=1;
}
run().catch(error=>{console.error(error);process.exitCode=1;});
