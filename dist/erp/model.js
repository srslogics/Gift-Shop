(function(root){
'use strict';
const activeStatuses=['Confirmed','Packing','Ready'];
const seed=()=>({version:1,items:[
{id:'candle',sku:'AU-101',name:'Amber glass candle',category:'Home & rituals',unit:'piece',stock:48,min:15,cost:680,supplier:'Amber & Wick Co.'},
{id:'cup',sku:'AU-102',name:'Ivory ceramic cup',category:'Ceramics',unit:'piece',stock:38,min:12,cost:420,supplier:'Earth & Form'},
{id:'chocolate',sku:'AU-103',name:'Artisan chocolate selection',category:'Gourmet',unit:'box',stock:30,min:10,cost:350,supplier:'Cacao House'},
{id:'box',sku:'PK-201',name:'Ivory presentation box',category:'Packaging',unit:'piece',stock:20,min:15,cost:280,supplier:'Paper & Parcel'},
{id:'ribbon',sku:'PK-202',name:'Burgundy satin ribbon',category:'Packaging',unit:'metre',stock:85,min:20,cost:45,supplier:'Paper & Parcel'},
{id:'card',sku:'PK-203',name:'Personal message card',category:'Packaging',unit:'piece',stock:100,min:25,cost:25,supplier:'Paper & Parcel'},
{id:'teapot',sku:'AU-104',name:'Ivory ceramic teapot',category:'Ceramics',unit:'piece',stock:18,min:5,cost:780,supplier:'Earth & Form'},
{id:'tea',sku:'AU-105',name:'Signature tea tin',category:'Gourmet',unit:'tin',stock:24,min:8,cost:260,supplier:'The Tea Edit'},
{id:'flowers',sku:'AU-106',name:'Seasonal flower arrangement',category:'Flowers',unit:'bunch',stock:12,min:4,cost:950,supplier:'Bloom Atelier'},
{id:'vase',sku:'AU-107',name:'Ivory keepsake vase',category:'Ceramics',unit:'piece',stock:16,min:5,cost:620,supplier:'Earth & Form'}
],hampers:[
{id:'signature',name:'The Signature Gesture',category:'The signature collection',image:'gift-atelier.jpg',price:6490,recipe:{candle:1,cup:1,chocolate:1,box:1,ribbon:2,card:1}},
{id:'tea-ritual',name:'A Moment for Two',category:'Home & rituals',image:'tea-ritual.jpg',price:4890,recipe:{cup:2,teapot:1,tea:1,box:1,ribbon:1,card:1}},
{id:'floral',name:'Poetry in Bloom',category:'Seasonal gifting',image:'floral-poetry.jpg',price:5290,recipe:{flowers:1,vase:1,ribbon:1,card:1}}
],orders:[
{id:'AU-1048',customer:'Ananya Mehta',channel:'Website',hamper:'signature',qty:2,status:'Confirmed',payment:'Paid',due:'2026-11-02',note:'For all the little things you do. Thank you.',price:6490,cost:1845,recipe:{candle:1,cup:1,chocolate:1,box:1,ribbon:2,card:1}},
{id:'AU-1047',customer:'Studio North',channel:'Corporate',hamper:'tea-ritual',qty:4,status:'Packing',payment:'Deposit',due:'2026-11-03',note:'A thoughtful thank you from Studio North.',price:4890,cost:2230,recipe:{cup:2,teapot:1,tea:1,box:1,ribbon:1,card:1}},
{id:'AU-1046',customer:'Rohan & Mira',channel:'Concierge',hamper:'floral',qty:2,status:'Ready',payment:'Paid',due:'2026-10-31',note:'A beautiful beginning. Congratulations!',price:5290,cost:1640,recipe:{flowers:1,vase:1,ribbon:1,card:1}},
{id:'AU-1045',customer:'Kavya Shah',channel:'Website',hamper:'signature',qty:1,status:'Dispatched',payment:'Paid',due:'2026-10-30',note:'Happy birthday, Mum.',price:6490,cost:1845,recipe:{candle:1,cup:1,chocolate:1,box:1,ribbon:2,card:1}},
{id:'AU-1044',customer:'The Olive Collective',channel:'Corporate',hamper:'signature',qty:6,status:'Dispatched',payment:'Paid',due:'2026-10-29',note:'With our warmest appreciation.',price:6490,cost:1845,recipe:{candle:1,cup:1,chocolate:1,box:1,ribbon:2,card:1}}
],quotes:[
{id:'QT-026',company:'The Finch Group',occasion:'Festive appreciation',hamper:'signature',qty:50,due:'2026-11-12',status:'Awaiting approval',note:'Gold-foil logo on sleeve. Individual recipient cards.',price:6490},
{id:'QT-025',company:'Atelier Design Co.',occasion:'Client appreciation',hamper:'tea-ritual',qty:8,due:'2026-11-08',status:'Draft',note:'Warm neutrals. Include a handwritten-style note.',price:4890},
{id:'QT-024',company:'Studio North',occasion:'Team celebration',hamper:'tea-ritual',qty:4,due:'2026-11-03',status:'Converted',note:'Sample approved by the client.',price:4890,orderId:'AU-1047'}
],activity:[{text:'Studio North moved to packing',time:'Sample activity'},{text:'Rohan & Mira is ready for dispatch',time:'Sample activity'},{text:'The Finch Group quotation prepared',time:'Sample activity'}]});
const item=(s,id)=>s.items.find(x=>x.id===id);
const hamper=(s,id)=>s.hampers.find(x=>x.id===id);
const reserved=(s,id)=>s.orders.filter(o=>activeStatuses.includes(o.status)).reduce((n,o)=>n+(o.recipe[id]||0)*o.qty,0);
const available=(s,id)=>Math.max(0,item(s,id).stock-reserved(s,id));
const cost=(s,recipe)=>Object.entries(recipe).reduce((n,[id,q])=>n+item(s,id).cost*q,0);
function capacity(s,recipe){const entries=Object.entries(recipe).filter(([,q])=>q>0);return entries.length?Math.min(...entries.map(([id,q])=>Math.floor(available(s,id)/q))):0;}
function bottleneck(s,recipe){return Object.entries(recipe).sort((a,b)=>Math.floor(available(s,a[0])/a[1])-Math.floor(available(s,b[0])/b[1]))[0]?.[0];}
function log(s,text){s.activity.unshift({text,time:new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})});s.activity=s.activity.slice(0,12);}
function nextId(list,prefix,start){return prefix+(Math.max(start,...list.map(x=>Number(x.id.split('-').pop())))+1);}
function addOrder(s,input){const h=hamper(s,input.hamper);if(!h)throw Error('Choose a gift collection.');const qty=Number(input.qty);if(!Number.isInteger(qty)||qty<1||qty>10000)throw Error('Enter a whole quantity between 1 and 10,000.');if(!String(input.customer||'').trim())throw Error('Add a customer or company name.');if(qty>capacity(s,h.recipe))throw Error(`Only ${capacity(s,h.recipe)} can be reserved. Receive more components in Inventory or reduce the quantity.`);if(!/^\d{4}-\d{2}-\d{2}$/.test(input.due||''))throw Error('Choose a delivery date.');const order={id:nextId(s.orders,'AU-',1048),customer:String(input.customer).trim().slice(0,100),channel:input.channel||'Concierge',hamper:h.id,qty,status:'Confirmed',payment:input.payment||'Pending',due:input.due,note:String(input.note||'').slice(0,500),price:h.price,cost:cost(s,h.recipe),recipe:{...h.recipe}};s.orders.unshift(order);log(s,`${order.id} created · ${qty} gift${qty===1?'':'s'} reserved`);return order;}
function advance(s,id){const o=s.orders.find(x=>x.id===id);if(!o||!activeStatuses.includes(o.status))throw Error('This order cannot be advanced.');if(o.status==='Ready'){for(const [key,q] of Object.entries(o.recipe)){if(item(s,key).stock<q*o.qty)throw Error('Not enough physical stock to dispatch.');}for(const [key,q]of Object.entries(o.recipe))item(s,key).stock-=q*o.qty;o.status='Dispatched';}else o.status=o.status==='Confirmed'?'Packing':'Ready';log(s,`${o.id} moved to ${o.status.toLowerCase()}`);return o;}
function cancel(s,id){const o=s.orders.find(x=>x.id===id);if(!o||!activeStatuses.includes(o.status))throw Error('Only active orders can be cancelled.');o.status='Cancelled';log(s,`${id} cancelled · components released`);}
function receive(s,id,qty){qty=Number(qty);if(!Number.isInteger(qty)||qty<1||qty>100000)throw Error('Enter a whole quantity between 1 and 100,000.');const i=item(s,id);if(!i)throw Error('Component not found.');i.stock+=qty;log(s,`Received ${qty} ${i.unit}${qty===1?'':'s'} · ${i.name}`);}
function addHamper(s,input){if(!String(input.name||'').trim())throw Error('Name your gift hamper.');const price=Number(input.price);if(!Number.isInteger(price)||price<1||price>1000000)throw Error('Enter a whole selling price between ₹1 and ₹10,00,000.');const recipe={};for(const [id,n]of Object.entries(input.recipe)){const q=Number(n);if(!item(s,id)||!Number.isInteger(q)||q<0||q>100)throw Error('Component quantities must be whole numbers from 0 to 100.');if(q)recipe[id]=q;}if(!Object.keys(recipe).length)throw Error('Add at least one component.');const h={id:'custom-'+Date.now(),name:input.name.trim().slice(0,80),price,recipe,category:'Bespoke collection',image:'gift-atelier.jpg'};s.hampers.push(h);log(s,`${h.name} added to the collection`);return h;}
const api={seed,item,hamper,reserved,available,cost,capacity,bottleneck,log,nextId,addOrder,advance,cancel,receive,addHamper,activeStatuses};root.ERP=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
