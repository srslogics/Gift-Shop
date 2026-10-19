(() => {
  'use strict';
  const { products, byId, money, filterProducts, cleanState, updateBag, totals } = window.Aurelle;
  const STORAGE_KEY = 'maison-aurelle-concept-v1';
  const modal = document.querySelector('#modal');
  const modalContent = document.querySelector('#modal-content');
  const grid = document.querySelector('#product-grid');
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const heart = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/></svg>';
  let state;
  try { state = cleanState(JSON.parse(localStorage.getItem(STORAGE_KEY))); } catch { state = cleanState(null); }
  let filter = 'All';
  let occasion = '';
  let showSaved = false;
  let query = '';
  let sort = 'curated';
  let returnFocus = null;
  let toastTimeout;
  function announce(message) {
    const toast = document.querySelector('#toast');
    clearTimeout(toastTimeout); toast.textContent = message; toast.hidden = false;
    toastTimeout = setTimeout(() => { toast.hidden = true; }, 3500);
  }
  function persist() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* The bag remains usable for this visit when storage is unavailable. */ }
    const { count } = totals(state.bag);
    document.querySelector('.bag-count').textContent = count;
    document.querySelector('.bag-button').setAttribute('aria-label', `Open shopping bag, ${count} item${count === 1 ? '' : 's'}`);
    document.querySelector('#saved-count').textContent = state.saved.length;
  }
  function productCard(p) {
    const saved = state.saved.includes(p.id);
    return `<article class="product-card"><div class="product-visual"><button class="product-image-button" data-product="${p.id}" aria-label="Explore ${p.name}"><img src="assets/${p.image}" width="600" height="750" loading="lazy" alt="${p.name}: ${p.subtitle}"></button><button class="save-button" data-save="${p.id}" aria-label="${saved ? 'Unsave' : 'Save'} ${p.name}" aria-pressed="${saved}">${heart}</button><span class="product-label">${p.label}</span></div><div class="product-info"><div class="product-info-top"><h3><button data-product="${p.id}">${p.name}</button></h3><span class="product-price">${money(p.price)}</span></div><p>${p.subtitle}</p><button class="quick-add" data-add="${p.id}" aria-label="Add ${p.name} to bag">Add to bag <span aria-hidden="true">+</span></button></div></article>`;
  }
  function renderCollection() {
    const visible = filterProducts({category: filter, occasion, query, saved: showSaved ? state.saved : null});
    if (sort === 'price-asc') visible.sort((a, b) => a.price - b.price);
    if (sort === 'price-desc') visible.sort((a, b) => b.price - a.price);
    grid.innerHTML = visible.length ? visible.map(productCard).join('') : '<div class="empty-state"><h3>A little room for discovery.</h3><p>No pieces match this selection yet. Explore the collection to find your favourite.</p><button class="button primary" data-action="reset-filters">Explore all gifts <span>↗</span></button></div>';
    document.querySelectorAll('[data-filter]').forEach(b => b.setAttribute('aria-pressed', b.dataset.filter === filter));
    document.querySelector('.saved-filter').setAttribute('aria-pressed', showSaved);
    const selection = document.querySelector('#active-selection');
    selection.hidden = !occasion;
    selection.innerHTML = occasion ? `<span>Thoughtful gifts for: <strong>${escape(occasion)}</strong></span><button data-action="clear-occasion">Clear occasion ×</button>` : '';
    document.querySelector('#collection-status').textContent = `${visible.length} gift${visible.length === 1 ? '' : 's'} in this selection`;
    document.querySelector('.reset-filters').hidden = !(filter !== 'All' || occasion || query || showSaved);
  }
  function openDialog(title, content, { eyebrow = 'MAISON AURELLE', bag = false } = {}) {
    if (!modal.open) returnFocus = document.activeElement;
    modal.classList.toggle('bag-dialog', bag);
    modalContent.innerHTML = `<header class="dialog-header"><div><p class="eyebrow">${eyebrow}</p><h2 id="dialog-title">${title}</h2></div><button class="close-button" data-action="close" aria-label="Close dialog">×</button></header><div class="dialog-body">${content}</div>`;
    document.body.classList.add('modal-open');
    if (!modal.open) modal.showModal();
    modal.scrollTop = 0;
    (modal.querySelector('[autofocus]') || modal.querySelector('.close-button')).focus();
  }
  function miniProduct(p) { return `<button class="mini-product" data-product="${p.id}"><img src="assets/${p.image}" alt="" width="65" height="75"><div><h3>${p.name}</h3><p>${p.category} · ${money(p.price)}</p></div><span aria-hidden="true">↗</span></button>`; }
  function showProduct(id) {
    const p = byId(id); if (!p) return;
    openDialog(p.name, `<div class="product-detail"><img src="assets/${p.image}" alt="${p.name}: illustrative product photography" width="600" height="750"><div><p class="detail-price">${money(p.price)}</p><p>${p.description}</p><h3>A look inside</h3><ul>${p.contents.map(c => `<li>${c}</li>`).join('')}</ul><button class="button primary" data-add="${p.id}">Add to bag <span>+</span></button><button class="text-link" data-action="bag">View your bag <span>→</span></button><p class="product-disclaimer">${p.note} No live purchases are available.</p></div></div>`, {eyebrow: `${p.category.toUpperCase()} / CONCEPT COLLECTION`});
  }
  function add(id) {
    const p = byId(id); if (!p) return;
    if ((state.bag.find(l => l.id === id)?.qty || 0) >= 10) return announce('You can add up to 10 of each piece in this demo.');
    state.bag = updateBag(state.bag, id, 1); persist();
    if (modal.open) {
      let status = modal.querySelector('.add-confirmation');
      if (!status) {
        status = document.createElement('p'); status.className = 'add-confirmation'; status.setAttribute('role', 'status');
        modal.querySelector('[data-add]').after(status);
      }
      status.textContent = `Added to your bag (${totals(state.bag).count} items)`;
    } else {
      showBag();
    }
  }
  function showBag() {
    const total = totals(state.bag);
    const content = state.bag.length ? `${state.bag.map(line => { const p = byId(line.id); return `<div class="bag-line"><img src="assets/${p.image}" width="90" height="110" alt="${p.name}"><div class="bag-line-body"><h3>${p.name}</h3><p>${money(p.price * line.qty)}</p><div class="quantity"><button data-quantity="${p.id}" data-delta="-1" aria-label="Decrease ${p.name} quantity">−</button><span aria-label="Quantity ${line.qty}">${line.qty}</span><button data-quantity="${p.id}" data-delta="1" aria-label="Increase ${p.name} quantity" ${line.qty === 10 ? 'disabled' : ''}>+</button></div><button class="remove-line" data-remove="${p.id}" aria-label="Remove ${p.name}">Remove</button></div></div>`; }).join('')}<div class="form-field bag-note"><label for="gift-note">A few words, from you</label><textarea id="gift-note" maxlength="240" placeholder="A thoughtful message for their card...">${escape(state.note)}</textarea><span class="muted">Optional · up to 240 characters · saved on this device</span></div><div class="bag-totals"><span>Illustrative subtotal</span><strong>${money(total.amount)}</strong></div><div class="bag-actions"><p class="muted">Sample prices only. Shipping, tax and fulfilment are not configured.</p><button class="button primary" data-action="review">Review gift selection <span>→</span></button><p class="muted">This is a concept preview. No payment will be taken and no order will be placed.</p><button class="text-link" data-action="close">Continue exploring</button></div>` : '<div class="empty-state"><h3>A thoughtful gesture starts here.</h3><p>Your bag is waiting for something lovely.</p><button class="button primary" data-action="browse">Explore the collection <span>↗</span></button></div>';
    openDialog(`Your gift bag <small>(${total.count})</small>`, content, {bag:true, eyebrow:'YOUR CONSIDERED SELECTION'});
  }
  function showReview() {
    if (!state.bag.length) return showBag();
    openDialog('A lovely selection.', `<p class="dialog-intro">Here is your gifting plan.</p>${state.bag.map(l => `<div class="mini-product"><div><h3>${byId(l.id).name}</h3><p>Quantity: ${l.qty}</p></div><span>${money(byId(l.id).price * l.qty)}</span></div>`).join('')}<div class="bag-totals"><span>Illustrative subtotal</span><strong>${money(totals(state.bag).amount)}</strong></div>${state.note ? `<h3>Your message</h3><p style="white-space:pre-wrap;margin-top:12px">${escape(state.note)}</p>` : ''}<div class="dialog-disclaimer">No order has been placed. This preview does not collect payment or delivery details. Save the selection as a text file, or continue exploring.</div><button class="button primary" data-action="download-selection">Download my selection <span>↓</span></button><button class="text-link" data-action="bag" style="margin-left:20px">Edit bag</button>`);
  }
  function showFinder() {
    openDialog('A gift that feels like them.', `<p class="dialog-intro">Tell us a little about the moment.</p><form id="finder-form"><div class="field-grid"><div class="form-field"><label for="finder-occasion">What is the occasion?</label><select id="finder-occasion" name="occasion"><option value="">Any thoughtful moment</option><option>Birthday</option><option>Thank you</option><option>Housewarming</option><option>Just because</option></select></div><div class="form-field"><label for="finder-budget">Your budget</label><select id="finder-budget" name="budget"><option value="999999">Open to something lovely</option><option value="3000">Up to ₹3,000</option><option value="5000">Up to ₹5,000</option><option value="7000">Up to ₹7,000</option></select></div></div><button class="button primary" type="submit">Find my gifts <span>↗</span></button></form><div id="finder-results" class="finder-results" aria-live="polite"></div>`, {eyebrow:'THE GIFT FINDER'});
  }
  function showSearch() {
    openDialog('What are you looking for?', '<label for="gift-search" class="sr-only">Search the gift collection</label><input id="gift-search" class="search-input" type="search" placeholder="Try candles, tea or flowers..." autofocus autocomplete="off"><div id="search-results" class="search-results" aria-live="polite"></div>', {eyebrow:'A LITTLE DISCOVERY'});
    renderSearch('');
  }
  function renderSearch(q) {
    const matches = filterProducts({query:q});
    document.querySelector('#search-results').innerHTML = `<p class="muted">${q ? `${matches.length} matching pieces` : 'Explore the collection'}</p>${matches.length ? matches.map(miniProduct).join('') : '<div class="empty-state"><h3>Nothing quite like that yet.</h3><p>Try “candle”, “tea”, “flowers” or “gift box”.</p></div>'}`;
  }
  function showBespoke() {
    openDialog('Something entirely your own.', `<p class="dialog-intro">Start with a moment. We will help you shape the brief.</p><p class="muted" style="margin-bottom:24px">Create a downloadable brief for a future consultation. Nothing is sent or stored on a server.</p><form id="bespoke-form"><div class="field-grid"><div class="form-field"><label for="brief-occasion">The occasion</label><select id="brief-occasion" name="occasion"><option>Corporate appreciation</option><option>Wedding celebration</option><option>Festive gifting</option><option>A personal occasion</option></select></div><div class="form-field"><label for="brief-quantity">Approximate number of gifts</label><input id="brief-quantity" name="quantity" type="number" min="1" max="10000" step="1" value="25" required></div><div class="form-field"><label for="brief-budget">Budget per gift (INR)</label><input id="brief-budget" name="budget" type="number" min="500" max="1000000" step="1" value="5000" required></div><div class="form-field"><label for="brief-date">Preferred date (optional)</label><input id="brief-date" name="date" type="date"></div></div><div class="form-field"><label for="brief-story">What should the gift say?</label><textarea id="brief-story" name="story" maxlength="1000" placeholder="A mood, a colour, a story or a few favourite things..." required></textarea></div><button class="button primary" type="submit">Download my gifting brief <span>↓</span></button><p class="muted" style="margin-top:15px">Demo brief only. No quote, availability or delivery date is confirmed.</p></form>`, {eyebrow:'BESPOKE GIFTING'});
  }
  function download(filename, text) {
    const blob = new Blob([text], {type:'text/plain;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function selectionText() {
    return `MAISON AURELLE\nIllustrative gift selection - not an order\n\n${state.bag.map(l => `${l.qty} x ${byId(l.id).name} - ${money(byId(l.id).price * l.qty)}`).join('\n')}\n\nIllustrative subtotal: ${money(totals(state.bag).amount)}\nShipping and tax not configured.\n\nGift message:\n${state.note || '(No message)'}\n\nAll products, images and prices are concept samples. No payment taken. No purchase or delivery confirmed.\n`;
  }
  const actions = {
    close: () => modal.close(),
    search: showSearch, bag: showBag, finder: showFinder, bespoke: showBespoke, review:showReview,
    browse: () => { modal.close(); document.querySelector('#collection').scrollIntoView(); },
    saved: () => { showSaved = !showSaved; renderCollection(); },
    'reset-filters': () => { filter = 'All'; occasion = ''; query = ''; showSaved = false; document.querySelector('#collection-search').value = ''; renderCollection(); document.querySelector('[data-filter="All"]').focus(); },
    'clear-occasion': () => { occasion = ''; renderCollection(); },
    'download-selection': () => { download('maison-aurelle-gift-selection.txt',selectionText()); announce('Your selection is ready to save. No order was placed.'); },
    menu: () => openDialog('A thoughtful place to begin.', '<nav class="menu-list" aria-label="Mobile navigation"><a href="#collection" data-action="close">The collection</a><a href="#occasions" data-action="close">By occasion</a><a href="#our-story" data-action="close">Our philosophy</a><button data-action="finder">Find a gift</button><button data-action="bespoke">Bespoke gifting</button></nav>'),
    faq: () => openDialog('A little guidance.', '<div class="faq-list"><details open><summary>Can I order these gifts?</summary><p>Not yet. This is an interactive boutique concept with fictional products, AI-generated imagery and sample prices. It does not accept payments or orders.</p></details><details><summary>Can I add a personal note?</summary><p>Yes. Add a message of up to 240 characters in your bag. Your note is saved on this device and included in your downloadable selection.</p></details><details><summary>Where do you deliver?</summary><p>Delivery regions, timelines, charges and returns will be defined when the real shop and fulfilment partners are confirmed.</p></details><details><summary>Can I create corporate or celebration gifts?</summary><p>The bespoke brief tool lets you outline an occasion, quantity, budget and story. Download the brief for discussion; it is not sent to a sales team.</p></details></div>'),
    privacy: () => openDialog('A thoughtful approach to privacy.', '<div class="prose"><h3>What this concept stores</h3><p>Your bag, saved pieces and optional gift note are stored in your browser on this device. They are not submitted to a shop server. Avoid entering sensitive information.</p><h3>What stays with you</h3><p>Searches and bespoke form fields are used only on this page. Downloaded selections and briefs are files on your device. There are no analytics scripts or external image requests in the storefront.</p><p>If you are viewing the private hosted version, the hosting platform separately manages sign-in and service logs under its own policies.</p><button class="button primary" data-action="clear-data">Clear my local shop data <span>×</span></button></div>'),
    'clear-data': () => { state = cleanState(null); persist(); renderCollection(); modal.close(); announce('Your bag, saved pieces and message have been cleared.'); },
    'about-demo': () => openDialog('The beginning of a beautiful boutique.', '<div class="prose"><p>Maison Aurelle is a working brand concept created by SS49 to explore a luxury gifting experience. It is not an established merchant.</p><p>The catalogue, prices in INR and AI-generated product photographs are illustrative. Search, saved pieces, the gift finder and bag work locally. Briefs can be downloaded, but no enquiries, payments or orders are submitted.</p><h3>Before a real launch</h3><p>The final brand, product catalogue, verified specifications, inventory, payments, shipping, customer support and store policies must be connected and approved.</p></div>')
  };
  document.addEventListener('click', event => {
    const button = event.target.closest('button,a'); if (!button) return;
    if (button.dataset.action && actions[button.dataset.action]) actions[button.dataset.action]();
    if (button.dataset.product) showProduct(button.dataset.product);
    if (button.dataset.add) add(button.dataset.add);
    if (button.dataset.save) {
      const id = button.dataset.save;
      state.saved = state.saved.includes(id) ? state.saved.filter(s => s !== id) : [...state.saved, id];
      persist(); renderCollection();
      (document.querySelector(`[data-save="${id}"]`) || document.querySelector('.saved-filter')).focus();
      announce(state.saved.includes(id) ? 'Saved to your favourite pieces' : 'Removed from saved pieces');
    }
    if (button.dataset.filter) { filter = button.dataset.filter; renderCollection(); }
    if (button.dataset.occasion) { occasion = button.dataset.occasion; filter = 'All'; query = ''; document.querySelector('#collection-search').value = ''; showSaved = false; renderCollection(); document.querySelector('#collection').scrollIntoView(); }
    if (button.dataset.quantity) {
      const id = button.dataset.quantity, delta = Number(button.dataset.delta);
      state.bag = updateBag(state.bag, id, delta); persist(); showBag();
      (modal.querySelector(`[data-quantity="${id}"][data-delta="${delta}"]:not(:disabled)`) || modal.querySelector(`[data-quantity="${id}"]`) || modal.querySelector('.close-button')).focus();
    }
    if (button.dataset.remove) { state.bag = state.bag.filter(l => l.id !== button.dataset.remove); persist(); showBag(); }
  });
  document.addEventListener('input', event => {
    if (event.target.id === 'gift-search') renderSearch(event.target.value);
    if (event.target.id === 'collection-search') { query = event.target.value; renderCollection(); }
    if (event.target.id === 'gift-note') { state.note = event.target.value.slice(0,240); persist(); }
  });
  document.querySelector('#collection-sort').addEventListener('change', event => { sort = event.target.value; renderCollection(); });
  document.addEventListener('submit', event => {
    if (event.target.id === 'finder-form') {
      event.preventDefault(); const data = new FormData(event.target);
      const results = filterProducts({occasion:data.get('occasion'),maxPrice:Number(data.get('budget'))});
      document.querySelector('#finder-results').innerHTML = results.length ? `<p class="eyebrow">${results.length} THOUGHTFUL ${results.length === 1 ? 'MATCH' : 'MATCHES'}</p>${results.map(miniProduct).join('')}` : '<div class="empty-state"><h3>A little more room?</h3><p>There is no exact match in this small collection. Try a higher budget or a different occasion.</p></div>';
    }
    if (event.target.id === 'bespoke-form') {
      event.preventDefault(); const data = new FormData(event.target);
      const quantity = Number(data.get('quantity')), budget = Number(data.get('budget'));
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10000 || !Number.isInteger(budget) || budget < 500 || budget > 1000000) return;
      if (!String(data.get('story')).trim()) { document.querySelector('#brief-story').setCustomValidity('Please add a few words about your gift.'); document.querySelector('#brief-story').reportValidity(); document.querySelector('#brief-story').setCustomValidity(''); return; }
      download('maison-aurelle-bespoke-brief.txt', `MAISON AURELLE\nBespoke gifting concept brief\n\nOccasion: ${data.get('occasion')}\nQuantity: ${quantity}\nBudget per gift: ${money(budget)}\nIndicative total budget: ${money(quantity * budget)}\nPreferred date: ${data.get('date') || 'To discuss'}\n\nThe story:\n${String(data.get('story')).slice(0,1000)}\n\nThis brief is not a quote or an order. No enquiry has been sent. Products, fulfilment, tax, shipping and timings require confirmation.\n`);
      announce('Your brief is ready to save. Nothing has been submitted.');
    }
  });
  modal.addEventListener('close', () => { document.body.classList.remove('modal-open'); if (returnFocus?.isConnected) returnFocus.focus(); });
  modal.addEventListener('click', event => {
    const r = modal.getBoundingClientRect();
    if (event.target === modal && (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom)) modal.close();
  });
  document.querySelector('#year').textContent = new Date().getFullYear();
  persist(); renderCollection();
})();
