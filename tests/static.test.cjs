const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname,'../dist');
const html = fs.readFileSync(path.join(root,'index.html'),'utf8');
const css = fs.readFileSync(path.join(root,'styles.css'),'utf8');
const app = fs.readFileSync(path.join(root,'app.js'),'utf8');
const {products} = require('../dist/catalog.js');

test('all HTML, CSS and catalogue asset references exist',()=>{
  const refs=[...html.matchAll(/(?:src|href)="([^"#]+)"/g)].map(m=>m[1]).filter(r=>!r.startsWith('https:'));
  refs.push(...[...css.matchAll(/url\('([^']+)'\)/g)].map(m=>m[1]),...products.map(p=>'assets/'+p.image));
  for(const ref of refs) assert.ok(fs.existsSync(path.join(root,ref)),ref);
});
test('document has unique IDs, one H1 and valid internal link destinations',()=>{
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(ids.length,new Set(ids).size);
  assert.equal((html.match(/<h1\b/g)||[]).length,1);
  for(const [,id] of html.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(id),id);
  for(const [,id] of html.matchAll(/aria-labelledby="([^"]+)"/g)) assert.ok(ids.includes(id)||id==='dialog-title',id);
});
test('privacy boundaries: no network submission, analytics or unsafe execution',()=>{
  assert.doesNotMatch(app,/\b(fetch|XMLHttpRequest|WebSocket|eval)\s*\(|sendBeacon|new Function/);
  assert.doesNotMatch(html,/<script[^>]+src="https?:/);
  assert.match(html,/name="robots" content="noindex,nofollow"/);
  assert.match(html,/name="referrer" content="strict-origin-when-cross-origin"/);
});
test('responsive and accessibility foundations are retained',()=>{
  assert.match(html,/<html lang="en"/); assert.match(html,/name="viewport"/);
  assert.match(html,/Skip to content/); assert.match(html,/<dialog[^>]+aria-labelledby/);
  assert.match(css,/prefers-reduced-motion/); assert.match(css,/:focus-visible/);
  assert.match(css,/@media\(max-width:640px\)/);
  for(const [,tag] of html.matchAll(/(<img\b[^>]*>)/g)) assert.match(tag,/\balt="[^"]*"/);
});
