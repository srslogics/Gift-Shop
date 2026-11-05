const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const catalog = require('../dist/catalog.js');
const storageApi = require('../dist/storage.js');

// Isolated application tests, not a substitute for a real browser layout pass.
function setup(saved = null, storageBlocked = false) {
  const listeners = {}, elements = new Map(), downloads = [];
  let document;
  function element(key) {
    if (elements.has(key)) return elements.get(key);
    const el = {
      innerHTML: '', textContent: '', value: '', hidden: false, dataset: {}, open: false,
      isConnected: true, attributes: {}, classList: {add(){}, remove(){}, toggle(){}},
      setAttribute(name, value) { this.attributes[name] = value; },
      getAttribute(name) { return this.attributes[name]; },
      focus() { document.activeElement = this; },
      scrollIntoView() { this.scrolled = true; },
      addEventListener(name, fn) { this[name] = fn; },
      showModal() { this.open = true; },
      close() { this.open = false; this.closeHandler?.(); },
      after(node) { elements.set('.add-confirmation', node); },
      click(){}, remove(){}, append(){}, setCustomValidity(value){this.validity = value;}, reportValidity(){},
      matches() { return false; },
      querySelector(selector) {
        if (selector === '[autofocus]') return null;
        if (selector === '.add-confirmation') return elements.get(selector) || null;
        return element(selector);
      }
    };
    elements.set(key, el); return el;
  }
  const filters = ['All','Gift boxes','Home & rituals','Flowers'].map(category => {
    const el = element(`[data-filter="${category}"]`); el.dataset.filter = category; return el;
  });
  const modal = element('#modal');
  modal.addEventListener = (name, fn) => { if (name === 'close') modal.closeHandler = fn; };
  document = {
    activeElement: element('opener'), body: element('body'),
    querySelector: element, querySelectorAll: () => filters,
    addEventListener: (name, fn) => { listeners[name] = fn; }, createElement: () => element(`created-${elements.size}`)
  };
  let stored = saved === null ? null : JSON.stringify(saved);
  const context = {
    window: {Aurelle:catalog, AurelleStorage:storageApi, addEventListener(){}}, document, console, CSS:{escape:value=>value},
    localStorage: {
      getItem() { if (storageBlocked) throw Error('Unavailable'); return stored; },
      setItem(key, value) { if (storageBlocked) throw Error('Unavailable'); stored = value; },
      removeItem() { if (storageBlocked) throw Error('Unavailable'); stored = null; }
    },
    setTimeout: () => 1, clearTimeout(){}, Blob,
    URL:{createObjectURL(blob){downloads.push(blob); return 'blob:test';}, revokeObjectURL(){}},
    FormData: class { constructor(form){this.values=form.values;} get(key){return this.values[key];} }
  };
  context.window.localStorage = context.localStorage;
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../dist/app.js'), 'utf8'), context);
  const click = dataset => { const button = {...element('button'), dataset}; return listeners.click({target:{closest:()=>button}}); };
  return {
    el:element, modal, downloads, click,
    action: action => click({action}), state: () => catalog.cleanState(JSON.parse(stored)),
    input(id, value) { element(`#${id}`).value = value; return listeners.input({target:{id,value}}); },
    submit(id, values) { listeners.submit({preventDefault(){},target:{id,values}}); },
    content: () => element('#modal-content').innerHTML
  };
}

test('startup survives denied local storage and still supports a bag', async () => {
  const app = setup(null, true); await app.click({add:'tea'});
  assert.equal(app.modal.open, true); assert.match(app.content(), /Your gift bag <small>\(1\)/);
});
test('quick add opens the bag and quantity controls update subtotal', async () => {
  const app = setup(); await app.click({add:'tea'}); await app.click({quantity:'tea',delta:'1'});
  assert.match(app.content(), /9,780/); assert.equal(app.state().bag[0].qty, 2);
  await app.click({remove:'tea'}); assert.match(app.content(), /Your bag is waiting/);
});
test('product add confirmation uses singular and cap notice is inside modal', async () => {
  const app = setup(); await app.click({product:'tea'}); await app.click({add:'tea'});
  assert.equal(app.el('.add-confirmation').textContent, 'Added to your bag (1 item)');
  for (let i=0;i<10;i++) await app.click({add:'tea'});
  assert.equal(app.state().bag[0].qty,10);
  assert.match(app.el('.dialog-status').textContent, /up to 10/);
});
test('gift notes are escaped in both bag and review markup', async () => {
  const app = setup(); await app.click({add:'amber'});
  await app.input('gift-note','</textarea><img src=x onerror=alert(1)>');
  await app.action('bag'); assert.ok(!app.content().includes('<img src=x'));
  assert.match(app.content(), /&lt;\/textarea&gt;/);
  await app.action('review'); assert.ok(!app.content().includes('<img src=x'));
});
test('notes remain bounded and are included in downloadable selection', async () => {
  const app = setup(); await app.click({add:'tea'}); await app.input('gift-note','x'.repeat(300));
  await app.action('review'); await app.action('download-selection');
  assert.equal(app.state().note.length,240);
  const text = await app.downloads[0].text(); assert.match(text,/not an order/); assert.ok(text.includes('x'.repeat(240)));
  assert.match(app.el('.dialog-status').textContent,/ready to save/);
});
test('search, sorting, filters and reset agree with rendered products', async () => {
  const app = setup(); await app.input('collection-search','tea');
  assert.equal(app.el('#collection-status').textContent,'1 gift in this selection');
  await app.action('reset-filters'); app.el('#collection-sort').change({target:{value:'price-asc'}});
  const html=app.el('#product-grid').innerHTML;
  assert.ok(html.indexOf('The Quiet Hour') < html.indexOf('A Moment for Two'));
  await app.click({filter:'Flowers'}); assert.match(app.el('#product-grid').innerHTML,/Poetry in Bloom/);
  assert.equal(app.el('#collection-status').textContent,'1 gift in this selection');
});
test('empty bag browse clears a previous no-results search', async () => {
  const app=setup(); await app.input('collection-search','nonexistent'); await app.action('bag'); await app.action('browse');
  assert.equal(app.el('#collection-status').textContent,'4 gifts in this selection');
  assert.equal(app.el('#collection-search').value,''); assert.equal(app.modal.open,false);
});
test('saved pieces toggle and privacy deletion update all stored data', async () => {
  const app=setup(); await app.click({save:'tea'}); await app.action('saved');
  assert.equal(app.el('#collection-status').textContent,'1 gift in this selection');
  await app.click({add:'tea'}); await app.input('gift-note','Test'); await app.action('privacy'); await app.action('clear-data');
  assert.deepEqual(app.state(),{bag:[],saved:[],note:''});
});
test('finder handles match and no-match combinations', async () => {
  const app=setup(); await app.action('finder');
  app.submit('finder-form',{occasion:'Housewarming',budget:'3000'});
  assert.match(app.el('#finder-results').innerHTML,/no exact match/);
  app.submit('finder-form',{occasion:'Thank you',budget:'3000'});
  assert.match(app.el('#finder-results').innerHTML,/The Quiet Hour/);
});
test('bespoke downloads correct totals and rejects invalid quantity or whitespace story', async () => {
  const app=setup(); await app.action('bespoke');
  const data={occasion:'Corporate appreciation',quantity:'25',budget:'5000',date:'',story:'Warm colours'};
  app.submit('bespoke-form',{...data,quantity:'0'}); assert.equal(app.downloads.length,0);
  app.submit('bespoke-form',{...data,story:'   '}); assert.equal(app.downloads.length,0);
  app.submit('bespoke-form',data); const text=await app.downloads[0].text();
  assert.match(text,/1,25,000/); assert.match(text,/No enquiry has been sent/);
});
test('all informational dialogs render and search does not echo injected markup', async () => {
  const app=setup();
  for(const action of ['faq','privacy','about-demo','menu','search']) {await app.action(action); assert.ok(app.content().includes('dialog-title'));}
  await app.input('gift-search','<svg onload=alert(1)>'); assert.ok(!app.content().includes('<svg onload'));
  assert.match(app.el('#search-results').innerHTML,/Nothing quite like that/);
});
