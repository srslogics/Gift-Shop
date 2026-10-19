(function (root) {
  'use strict';
  const products = [
    { id: 'signature', name: 'The Signature Gesture', subtitle: 'A little of everything lovely', category: 'Gift boxes', price: 6490, image: 'gift-atelier.jpg', label: 'THE SIGNATURE', occasions: ['Birthday', 'Thank you', 'Housewarming', 'Just because'], description: 'A considered collection for a person who deserves a moment to themselves. Warm amber, a quiet cup, and something sweet, brought together in our ivory presentation box.', contents: ['Amber glass candle', 'Ivory ceramic cup', 'Chocolate selection', 'Reusable presentation box and ribbon'], note: 'Illustrative gift set. Ingredients, allergens and exact specifications must be confirmed before a real launch.' },
    { id: 'amber', name: 'The Quiet Hour', subtitle: 'A softer kind of evening', category: 'Home & rituals', price: 2490, image: 'amber-candle.jpg', label: 'A DAILY RITUAL', occasions: ['Birthday', 'Thank you', 'Just because'], description: 'For slow evenings and the pleasure of staying in. An amber-glass candle with a brass-toned lid, paired with a ribbon-wrapped matchbox.', contents: ['Amber glass candle', 'Brass-toned lid', 'Ribbon-wrapped matchbox'], note: 'Illustrative candle concept. Fragrance, wax, burn time and safety specifications are not yet defined.' },
    { id: 'tea', name: 'A Moment for Two', subtitle: 'Good company, beautifully served', category: 'Home & rituals', price: 4890, image: 'tea-ritual.jpg', label: 'THE HOST EDIT', occasions: ['Birthday', 'Thank you', 'Housewarming'], description: 'An invitation to pause together. Soft ivory ceramics, natural linen and a tea ritual made for conversation, not the clock.', contents: ['Two ceramic cups and saucers', 'Ceramic teapot', 'Tea tin', 'Linen napkin'], note: 'Illustrative tea set. Materials, tea ingredients and food-contact specifications need supplier verification.' },
    { id: 'floral', name: 'Poetry in Bloom', subtitle: 'For words that need no saying', category: 'Flowers', price: 5290, image: 'floral-poetry.jpg', label: 'A BEAUTIFUL GESTURE', occasions: ['Birthday', 'Thank you', 'Housewarming', 'Just because'], description: 'Sculptural flowers, deep burgundy tones and a ceramic vase to keep. A thoughtful gesture for the moments worth remembering.', contents: ['Illustrative seasonal flower arrangement', 'Ivory ceramic vase', 'Ribbon-tied presentation and message card'], note: 'Concept imagery only. Flower availability, vase size, delivery area and care guidance are not yet finalised.' }
  ];
  const byId = id => products.find(p => p.id === id);
  const money = value => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
  function filterProducts({ category = 'All', occasion = '', maxPrice = Infinity, query = '', saved = null } = {}) {
    const q = String(query).trim().toLowerCase();
    return products.filter(p => (category === 'All' || p.category === category) && (!occasion || p.occasions.includes(occasion)) && p.price <= maxPrice && (!saved || saved.includes(p.id)) && (!q || `${p.name} ${p.subtitle} ${p.category} ${p.description} ${p.contents.join(' ')}`.toLowerCase().includes(q)));
  }
  function cleanState(value) {
    const obj = value && typeof value === 'object' ? value : {};
    const seen = new Set();
    const bag = (Array.isArray(obj.bag) ? obj.bag : []).filter(line => {
      if (!line || !byId(line.id) || seen.has(line.id) || !Number.isInteger(line.qty) || line.qty < 1) return false;
      seen.add(line.id); return true;
    }).map(line => ({ id: line.id, qty: Math.min(line.qty, 10) }));
    return { bag, saved: [...new Set(Array.isArray(obj.saved) ? obj.saved.filter(id => byId(id)) : [])], note: typeof obj.note === 'string' ? obj.note.slice(0, 240) : '' };
  }
  function updateBag(bag, id, delta) {
    if (!byId(id) || !Number.isInteger(delta)) return cleanState({bag}).bag;
    const next = cleanState({bag}).bag;
    const line = next.find(l => l.id === id);
    if (line) line.qty = Math.min(10, Math.max(0, line.qty + delta));
    else if (delta > 0) next.push({ id, qty: Math.min(10, delta) });
    return next.filter(l => l.qty > 0);
  }
  function totals(bag) { return cleanState({bag}).bag.reduce((total, line) => ({ count: total.count + line.qty, amount: total.amount + byId(line.id).price * line.qty }), {count: 0, amount: 0}); }
  const api = { products, byId, money, filterProducts, cleanState, updateBag, totals };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.Aurelle = api;
})(typeof window !== 'undefined' ? window : globalThis);
