const Store = (()=>{ const KEY='ledgerpwa.v1';
  const defaultProducts={ 'Tydineal cream':700,'Tydisil Cream':945,'Anofast Gel':700,'Tydiclear Cream':515,'Tydibact Cream':580,'Borocare Cream':1520,'Klaract Cream':1565,'Ciprofloxacin Tablet':400,'Metformin Tablet':800,'Vitamin C Syrup':300,'Gentamicin Inj':5995,'Diclofenac Inj':4550,'Artemether Inj':4350,'M&B Isopropyl Alcohol':950 };
  function load(){ try{ return JSON.parse(localStorage.getItem(KEY))||{ ledgers:['General'], payments:[], receivables:[], favoriteCustomers:[], stock:{ 'General':{ products:Object.fromEntries(Object.entries(defaultProducts).map(function(e){return [e[0],{price:e[1],qty:0}];})) } } }; }catch(e){ return { ledgers:['General'], payments:[], receivables:[], favoriteCustomers:[], stock:{ 'General':{ products:{} } } }; } }
  function save(s){ localStorage.setItem(KEY, JSON.stringify(s)); }
  const state=load();
  function ensureLedgerStock(ledger){ if(!state.stock[ledger]) state.stock[ledger]={products:{}}; for(const k in defaultProducts){ if(!state.stock[ledger].products[k]) state.stock[ledger].products[k]={price:defaultProducts[k],qty:0}; } }
  return {
    getLedgers: function(){ return Array.from(state.ledgers); },
    addLedger: function(name){ var nm=String(name||'').trim(); if(!nm) return {ok:false,msg:'Enter a name'}; if(state.ledgers.indexOf(nm)>=0) return {ok:false,msg:'Ledger already exists'}; state.ledgers.push(nm); ensureLedgerStock(nm); save(state); return {ok:true}; },
    // PAYMENTS
    addCredit: function(o){ var id=(crypto&&crypto.randomUUID)?crypto.randomUUID():('c'+Date.now()); var createdAt=new Date().toISOString(); var amt=Number(o.amount||0); state.payments.push({id:id,type:'credit',date:o.date,name:o.name||'',paymentType:o.paymentType||'Transfer',amount:amt,ledger:o.ledger,createdAt:createdAt}); save(state); },
    addDebit: function(o){ var id=(crypto&&crypto.randomUUID)?crypto.randomUUID():('d'+Date.now()); var createdAt=new Date().toISOString(); var amt=Number(o.amount||0); state.payments.push({id:id,type:'debit',date:o.date,invoiceType:o.invoiceType||'',invoiceNumber:o.invoiceNumber||'',amount:amt,ledger:o.ledger,createdAt:createdAt}); save(state); },
    deletePayment: function(id){ var i=state.payments.findIndex(function(p){return p.id===id;}); if(i>=0){ state.payments.splice(i,1); save(state);} },
    listPayments: function(ledger){ var arr=Array.from(state.payments); if(ledger&&ledger!=='All') arr=arr.filter(function(p){return p.ledger===ledger;}); arr.sort(function(a,b){ var ad=a.date||a.createdAt; var bd=b.date||b.createdAt; return bd.localeCompare(ad); }); return arr; },
    paymentsTotals: function(ledger){ if(ledger==='All'||!ledger){ var c=0,d=0; state.payments.forEach(function(p){ if(p.type==='credit') c+=Number(p.amount||0); else d+=Number(p.amount||0); }); return {credits:c,debits:d}; } var arr=state.payments.filter(function(p){return p.ledger===ledger;}); var c2=0,d2=0; arr.forEach(function(p){ if(p.type==='credit') c2+=Number(p.amount||0); else d2+=Number(p.amount||0); }); return {credits:c2,debits:d2}; },
    // RECEIVABLES
    addReceivable: function(o){ var id=(crypto&&crypto.randomUUID)?crypto.randomUUID():('r'+Date.now()); var createdAt=new Date().toISOString(); var amt=Number(o.amount||0); state.receivables.push({id:id,date:o.date,customer:o.customer||'',invoiceNumber:o.invoiceNumber||'',amount:amt,comment:o.comment||'',ledger:o.ledger,createdAt:createdAt}); save(state); },
    deleteReceivable: function(id){ var i=state.receivables.findIndex(function(r){return r.id===id;}); if(i>=0){ state.receivables.splice(i,1); save(state);} },
    updateReceivable: function(id,fields){ var it=state.receivables.find(function(r){return r.id===id;}); if(it){ for(var k in fields){ it[k]=fields[k]; } save(state); } },
    listReceivables: function(ledger){ var arr=Array.from(state.receivables); if(ledger&&ledger!=='All') arr=arr.filter(function(r){return r.ledger===ledger;}); arr.sort(function(a,b){ var ad=a.date||a.createdAt; var bd=b.date||b.createdAt; return bd.localeCompare(ad); }); return arr; },
    receivablesTotal: function(ledger){ return state.receivables.filter(function(r){return r.ledger===ledger;}).reduce(function(s,r){return s+Number(r.amount||0);},0); },
    // FAVOURITES
    getFavourites: function(){ return Array.from(state.favoriteCustomers||[]); },
    addFavourite: function(name){ var nm=String(name||'').trim(); if(!nm) return {ok:false,msg:'Enter a name'}; if((state.favoriteCustomers||[]).indexOf(nm)>=0) return {ok:false,msg:'Already in favourites'}; if((state.favoriteCustomers||[]).length>=5) return {ok:false,msg:'Maximum 5 favourites'}; state.favoriteCustomers.push(nm); save(state); return {ok:true}; },
    removeFavourite: function(name){ state.favoriteCustomers=state.favoriteCustomers.filter(function(n){return n!==name;}); save(state); },
    // STOCK
    listProducts: function(){ return defaultProducts; },
    setStock: function(ledger,product,price,qty){ ensureLedgerStock(ledger); var p=state.stock[ledger].products[product]||{price:0,qty:0}; if(price!=null && !Number.isNaN(Number(price))) p.price=Number(price); if(qty!=null && !Number.isNaN(Number(qty))) p.qty=Number(qty); state.stock[ledger].products[product]=p; save(state); },
    getStockForLedger: function(ledger){ ensureLedgerStock(ledger); var items=state.stock[ledger].products||{}; return Object.keys(items).map(function(name){ var v=items[name]; var price=Number(v.price||0), qty=Number(v.qty||0); return {name:name,price:price,qty:qty,value:price*qty}; }); },
    stockTotalValue: function(ledger){ return (this.getStockForLedger(ledger)||[]).reduce(function(s,it){return s+it.value;},0); },

    // Backup/Restore helpers
    exportState: function(){ return JSON.parse(JSON.stringify(state)); },
    importState: function(obj){ try{ if(!obj||typeof obj!=='object') return {ok:false,msg:'Invalid file'}; if(!Array.isArray(obj.ledgers)) return {ok:false,msg:'Missing ledgers'}; state.ledgers = Array.from(new Set(obj.ledgers||[])); state.payments = Array.isArray(obj.payments)? obj.payments : []; state.receivables = Array.isArray(obj.receivables)? obj.receivables : []; state.favoriteCustomers = Array.isArray(obj.favoriteCustomers)? obj.favoriteCustomers : []; state.stock = (obj.stock && typeof obj.stock==='object') ? obj.stock : {}; for(var i=0;i<state.ledgers.length;i++){ ensureLedgerStock(state.ledgers[i]); } save(state); return {ok:true}; } catch(e){ return {ok:false,msg:'Import failed'}; } },
    clearTransactionsAndStock: function(){ state.payments=[]; state.receivables=[]; for(var i=0;i<state.ledgers.length;i++){ var l=state.ledgers[i]; ensureLedgerStock(l); var prods=state.stock[l].products||{}; Object.keys(prods).forEach(function(k){ prods[k].qty=0; }); state.stock[l].products=prods; } save(state); }
  };
})();
function naira(n){ return new Intl.NumberFormat('en-NG',{style:'currency',currency:'NGN',minimumFractionDigits:2}).format(Number(n||0)); }
