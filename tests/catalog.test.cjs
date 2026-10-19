const test = require('node:test');
const assert = require('node:assert/strict');
const {products, filterProducts, cleanState, updateBag, totals, money} = require('../dist/catalog.js');
test('catalog has unique IDs and valid prices', () => {
  assert.equal(new Set(products.map(p => p.id)).size, products.length);
  products.forEach(p => assert.ok(Number.isInteger(p.price) && p.price > 0));
});
test('category filtering is exact', () => {
  assert.deepEqual(filterProducts({category:'Home & rituals'}).map(p=>p.id), ['amber','tea']);
  assert.equal(filterProducts({category:'Flowers'}).length, 1);
});
test('finder combines occasion and budget without false matches', () => {
  assert.deepEqual(filterProducts({occasion:'Thank you',maxPrice:3000}).map(p=>p.id), ['amber']);
  assert.equal(filterProducts({occasion:'Housewarming',maxPrice:3000}).length,0);
  assert.deepEqual(filterProducts({occasion:'Housewarming',maxPrice:5000}).map(p=>p.id), ['tea']);
});
test('search ignores case and searches gift contents', () => {
  assert.ok(filterProducts({query:'  TEAPOT  '}).some(p=>p.id==='tea'));
  assert.equal(filterProducts({query:'not-a-product'}).length,0);
});
test('saved selection can be empty or intersect with category', () => {
  assert.equal(filterProducts({saved:[]}).length,0);
  assert.deepEqual(filterProducts({saved:['amber','floral'],category:'Flowers'}).map(p=>p.id),['floral']);
});
test('untrusted saved state is sanitised', () => {
  const s = cleanState({bag:[null,{id:'fake',qty:1},{id:'tea',qty:25},{id:'tea',qty:4},{id:'amber',qty:-1},{id:'floral',qty:1.5}],saved:['tea','tea','fake'],note:'x'.repeat(500)});
  assert.deepEqual(s.bag,[{id:'tea',qty:10}]);assert.deepEqual(s.saved,['tea']);assert.equal(s.note.length,240);
  assert.deepEqual(cleanState(null),{bag:[],saved:[],note:''});
});
test('bag mutations preserve input, cap quantities and remove at zero', () => {
  const original=[{id:'tea',qty:1}];
  assert.deepEqual(updateBag(original,'tea',1),[{id:'tea',qty:2}]);assert.equal(original[0].qty,1);
  assert.deepEqual(updateBag(original,'tea',-1),[]);
  assert.deepEqual(updateBag(original,'tea',100),[{id:'tea',qty:10}]);
  assert.deepEqual(updateBag(original,'invalid',1),original);
});
test('totals reflect quantities and ignore unknown products', () => {
  assert.deepEqual(totals([{id:'tea',qty:2},{id:'amber',qty:1},{id:'invalid',qty:9}]),{count:3,amount:12270});
  assert.deepEqual(totals([]),{count:0,amount:0});
  assert.ok(money(6490).includes('6,490'));
});
