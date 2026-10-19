const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const catalog = require('../dist/catalog.js');

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
    window: {Aurelle:catalog}, document, console,
    localStorage: {
      getItem() { if (storageBlocked) throw Error('Unavailable'); return stored; },
      setItem(key, value) { if (storageBlocked) throw Error('Unavailable'); stored = value; }
    },
    setTimeout: () => 1, clearTimeout(){}, Blob,
    URL:{createObjectURL(blob){downloads.push(blob); return 'blob:test';}, revokeObjectURL(){}},
    FormData: class { constructor(form){this.values=form.values;} get(key){return this.values[key];} }
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../dist/app.js'), 'utf8'), context);
  const click = dataset => { const button = {...element('button'), dataset}; listeners.click({target:{closest:()=>button}}); };
  return {
    el:element, modal, downloads, click,
    action: action => click({action}), state: () => JSON.parse(stored),
    input(id, value) { element(`#${id}`).value = value; listeners.input({target:{id,value}}); },
    submit(id, values) { listeners.submit({preventDefault(){},target:{id,values}}); },
    content: () => element('#modal-content').innerHTML
  };
}

test('startup survives denied local storage and still supports a bag', () => {
  const app = setup(null, true); app.click({add:'tea'});
  assert.equal(app.modal.open, true); assert.match(app.content(), /Your gift bag <small>\(1\)/);
});
test('quick add opens the bag and quantity controls update subtotal', () => {
  const app = setup(); app.click({add:'tea'}); app.click({quantity:'tea',delta:'1'});
  assert.match(app.content(), /9,780/); assert.equal(app.state().bag[0].qty, 2);
  app.click({remove:'tea'}); assert.match(app.content(), /Your bag is waiting/);
});
test('product add confirmation uses singular and cap notice is inside modal', () => {
  const app = setup(); app.click({product:'tea'}); app.click({add:'tea'});
  assert.equal(app.el('.add-confirmation').textContent, 'Added to your bag (1 item)');
  for (let i=0;i<10;i++) app.click({add:'tea'});
  assert.equal(app.state().bag[0].qty,10);
  assert.match(app.el('.dialog-status').textContent, /up to 10/);
});
test('gift notes are escaped in both bag and review markup', () => {
  const app = setup(); app.click({add:'amber'});
  app.input('gift-note','</textarea><img src=x onerror=alert(1)>');
  app.action('bag'); assert.ok(!app.content().includes('<img src=x'));
  assert.match(app.content(), /&lt;\/textarea&gt;/);
  app.action('review'); assert.ok(!app.content().includes('<img src=x'));
});
test('notes remain bounded and are included in downloadable selection', async () => {
  const app = setup(); app.click({add:'tea'}); app.input('gift-note','x'.repeat(300));
  app.action('review'); app.action('download-selection');
  assert.equal(app.state().note.length,240);
  const text = await app.downloads[0].text(); assert.match(text,/not an order/); assert.ok(text.includes('x'.repeat(240)));
  assert.match(app.el('.dialog-status').textContent,/ready to save/);
});
test('search, sorting, filters and reset agree with rendered products', () => {
  const app = setup(); app.input('collection-search','tea');
  assert.equal(app.el('#collection-status').textContent,'1 gift in this selection');
  app.action('reset-filters'); app.el('#collection-sort').change({target:{value:'price-asc'}});
  const html=app.el('#product-grid').innerHTML;
  assert.ok(html.indexOf('The Quiet Hour') < html.indexOf('A Moment for Two'));
  app.click({filter:'Flowers'}); assert.match(app.el('#product-grid').innerHTML,/Poetry in Bloom/);
  assert.equal(app.el('#collection-status').textContent,'1 gift in this selection');
});
test('empty bag browse clears a previous no-results search', () => {
  const app=setup(); app.input('collection-search','nonexistent'); app.action('bag'); app.action('browse');
  assert.equal(app.el('#collection-status').textContent,'4 gifts in this selection');
  assert.equal(app.el('#collection-search').value,''); assert.equal(app.modal.open,false);
});
test('saved pieces toggle and privacy deletion update all stored data', () => {
  const app=setup(); app.click({save:'tea'}); app.action('saved');
  assert.equal(app.el('#collection-status').textContent,'1 gift in this selection');
  app.click({add:'tea'}); app.input('gift-note','Test'); app.action('privacy'); app.action('clear-data');
  assert.deepEqual(app.state(),{bag:[],saved:[],note:''});
});
test('finder handles match and no-match combinations', () => {
  const app=setup(); app.action('finder');
  app.submit('finder-form',{occasion:'Housewarming',budget:'3000'});
  assert.match(app.el('#finder-results').innerHTML,/no exact match/);
  app.submit('finder-form',{occasion:'Thank you',budget:'3000'});
  assert.match(app.el('#finder-results').innerHTML,/The Quiet Hour/);
});
test('bespoke downloads correct totals and rejects invalid quantity or whitespace story', async () => {
  const app=setup(); app.action('bespoke');
  const data={occasion:'Corporate appreciation',quantity:'25',budget:'5000',date:'',story:'Warm colours'};
  app.submit('bespoke-form',{...data,quantity:'0'}); assert.equal(app.downloads.length,0);
  app.submit('bespoke-form',{...data,story:'   '}); assert.equal(app.downloads.length,0);
  app.submit('bespoke-form',data); const text=await app.downloads[0].text();
  assert.match(text,/1,25,000/); assert.match(text,/No enquiry has been sent/);
});
test('all informational dialogs render and search does not echo injected markup', () => {
  const app=setup();
  for(const action of ['faq','privacy','about-demo','menu','search']) {app.action(action); assert.ok(app.content().includes('dialog-title'));}
  app.input('gift-search','<svg onload=alert(1)>'); assert.ok(!app.content().includes('<svg onload'));
  assert.match(app.el('#search-results').innerHTML,/Nothing quite like that/);
});
