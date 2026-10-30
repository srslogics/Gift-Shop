const test = require('node:test');
const assert = require('node:assert/strict');
const { createStore, KEY } = require('../dist/storage.js');
const { cleanState, updateBag } = require('../dist/catalog.js');
function fixture() {
  let value = null, failWrite = false, failRemove = false, tail = Promise.resolve();
  const storage = { getItem: () => value, setItem(k,v) { if(failWrite) throw Error(); value=v; }, removeItem() { if(failRemove) throw Error(); value=null; } };
  const locks = { request(key,fn) { const result=tail.then(fn); tail=result.catch(()=>{}); return result; } };
  return {storage, create:onChange=>createStore({storage,locks,cleanState,onChange}), read:()=>JSON.parse(value), failWrite:()=>failWrite=true, failRemove:()=>failRemove=true};
}
test('stale tabs and concurrent increments preserve each other’s changes',async()=>{
  const f=fixture(), a=f.create(), b=f.create();
  const add=s=>({...s,bag:updateBag(s.bag,'tea',1)});
  await Promise.all([a.update(add), b.update(add)]);
  await b.update(s=>({...s,saved:['amber']}));
  assert.deepEqual(f.read().bag,[{id:'tea',qty:2}]);
  assert.deepEqual(f.read().saved,['amber']);
});
test('clear removes the key and stale tabs cannot restore a note',async()=>{
  const f=fixture(), a=f.create(), b=f.create();
  await a.update(s=>({...s,note:'Private'}));
  assert.equal((await a.clear()).saved,true); assert.equal(f.read(),null);
  await b.update(s=>({...s,saved:['tea']}));
  assert.equal(f.read().note,'');
});
test('failed deletion never reports success',async()=>{
  const f=fixture(), a=f.create(); await a.update(s=>({...s,note:'Private'}));
  f.failRemove(); const result=await a.clear();
  assert.equal(result.saved,false); assert.equal(result.state.note,''); assert.equal(f.read().note,'Private');
});
test('failed writes retain temporary changes and report them as unsaved',async()=>{
  const f=fixture(), a=f.create(); f.failWrite();
  assert.equal((await a.update(s=>({...s,note:'Temporary'}))).saved,false);
  assert.equal((await a.update(s=>({...s,saved:['tea']}))).state.note,'Temporary');
});
test('storage events read latest state and filter unrelated storage',async()=>{
  const f=fixture(); let changed;
  const a=f.create(), b=f.create(s=>changed=s);
  await a.update(s=>({...s,note:'New'}));
  b.sync({key:KEY,storageArea:{}}); assert.equal(changed,undefined);
  b.sync({key:KEY,storageArea:f.storage,newValue:'old event payload'}); assert.equal(changed.note,'New');
  await a.clear(); b.sync({key:KEY,storageArea:f.storage,newValue:null}); assert.equal(changed.note,'');
});
