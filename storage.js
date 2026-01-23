var Store = (function(){ var KEY='ledgerpwa.v1';
  function load(){
    try{
      var raw = JSON.parse(localStorage.getItem(KEY));
      if (raw && typeof raw === 'object') return raw;
    }catch(e){}
    var defStock = { products:{} };
    var defaults = { 'Tydineal cream':700,'Tydisil Cream':945,'Anofast Gel':700,'Tydiclear Cream':515,'Tydibact Cream':580,'Borocare Cream':1520,'Klaract Cream':1565,'Ciprofloxacin Tablet':400,'Metformin Tablet':800,'Vitamin C Syrup':300,'Gentamicin Inj':5995,'Diclofenac Inj':4550,'Artemether Inj':4350,'M&B Isopropyl Alcohol':950 };
    for (var k in defaults){ if(defaults.hasOwnProperty(k)) defStock.products[k] = { price: defaults[k], qty: 0 }; }
    return { ledgers:['General'], payments:[], receivables:[], favoriteCustomers:[], stock:{ 'General': defStock } };
  }
  function save(s){ try{ localStorage.setItem(KEY, JSON.stringify(s)); }catch(e){} }
  var state = load();
  function ensureLedgerStock(ledger){ if(!state.stock[ledger]) state.stock[ledger]={products:{}}; var defaults={ 'Tydineal cream':700,'Tydisil Cream':945,'Anofast Gel':700,'Tydiclear Cream':515,'Tydibact Cream':580,'Borocare Cream':1520,'Klaract Cream':1565,'Ciprofloxacin Tablet':400,'Metformin Tablet':800,'Vitamin C Syrup':300,'Gentamicin Inj':5995,'Diclofenac Inj':4550,'Artemether Inj':4350,'M&B Isopropyl Alcohol':950 }; for(var k in defaults){ if(defaults.hasOwnProperty(k) && !state.stock[ledger].products[k]) state.stock[ledger].products[k] = { price: defaults[k], qty: 0 }; } }
  function idxById(arr, id){ for(var i=0;i<arr.length;i++){ if(arr[i].id===id) return i; } return -1; }
  function hasValue(arr, v){ for(var i=0;i<arr.length;i++){ if(arr[i]===v) return true; } return false; }
  return {
    getLedgers: function(){ var out=[]; for(var i=0;i<(state.ledgers||[]).length;i++) out.push(state.ledgers[i]); return out; },
    addLedger: function(name){ var nm=String(name||'').trim(); if(!nm) return {ok:false,msg:'Enter a name'}; if(!state.ledgers) state.ledgers=[]; if(hasValue(state.ledgers,nm)) return {ok:false,msg:'Ledger already exists'}; state.ledgers.push(nm); ensureLedgerStock(nm); save(state); return {ok:true}; },
    addCredit: function(o){ var id=(window.crypto&&window.crypto.randomUUID)?crypto.randomUUID():('c'+Date.now()+Math.random().toString(16).slice(2)); var createdAt=new Date().toISOString(); var amt=Number(o.amount||0); state.payments.push({id:id,type:'credit',date:o.date,name:o.name||'',paymentType:o.paymentType||'Transfer',amount:amt,ledger:o.ledger,createdAt:createdAt}); save(state); },
    addDebit: function(o){ var id=(window.crypto&&window.crypto.randomUUID)?crypto.randomUUID():('d'+Date.now()+Math.random().toString(16).slice(2)); var createdAt=new Date().toISOString(); var amt=Number(o.amount||0); state.payments.push({id:id,type:'debit',date:o.date,invoiceType:o.invoiceType||'',invoiceNumber:o.invoiceNumber||'',amount:amt,ledger:o.ledger,createdAt:createdAt}); save(state); },
    deletePayment: function(id){ var i=idxById(state.payments,id); if(i>=0){ state.payments.splice(i,1); save(state);} },
    listPayments: function(ledger){ var arr=[]; for(var i=0;i<state.payments.length;i++){ var p=state.payments[i]; if(!ledger || ledger==='All' || p.ledger===ledger) arr.push(p); } arr.sort(function(a,b){ var ad=a.date||a.createdAt; var bd=b.date||b.createdAt; return bd.localeCompare(ad); }); return arr; },
    paymentsTotals: function(ledger){ var c=0,d=0; for(var i=0;i<state.payments.length;i++){ var p=state.payments[i]; if(ledger && ledger!=='All' && p.ledger!==ledger) continue; if(p.type==='credit') c+=Number(p.amount||0); else d+=Number(p.amount||0); } return {credits:c,debits:d}; },
    addReceivable: function(o){ var id=(window.crypto&&window.crypto.randomUUID)?crypto.randomUUID():('r'+Date.now()+Math.random().toString(16).slice(2)); var createdAt=new Date().toISOString(); var amt=Number(o.amount||0); state.receivables.push({id:id,date:o.date,customer:o.customer||'',invoiceNumber:o.invoiceNumber||'',amount:amt,comment:o.comment||'',ledger:o.ledger,createdAt:createdAt}); save(state); },
    deleteReceivable: function(id){ var i=idxById(state.receivables,id); if(i>=0){ state.receivables.splice(i,1); save(state);} },
    updateReceivable: function(id,fields){ var i=idxById(state.receivables,id); if(i>=0){ var it=state.receivables[i]; for(var k in fields){ if(fields.hasOwnProperty(k)) it[k]=fields[k]; } save(state);} },
    listReceivables: function(ledger){ var arr=[]; for(var i=0;i<state.receivables.length;i++){ var r=state.receivables[i]; if(!ledger || ledger==='All' || r.ledger===ledger) arr.push(r); } arr.sort(function(a,b){ var ad=a.date||a.createdAt; var bd=b.date||b.createdAt; return bd.localeCompare(ad); }); return arr; },
    receivablesTotal: function(ledger){ var s=0; for(var i=0;i<state.receivables.length;i++){ var r=state.receivables[i]; if(r.ledger===ledger) s+=Number(r.amount||0); } return s; },
    getFavourites: function(){ return (state.favoriteCustomers||[]).slice(); },
    addFavourite: function(name){ var nm=String(name||'').trim(); if(!nm) return {ok:false,msg:'Enter a name'}; state.favoriteCustomers=state.favoriteCustomers||[]; if(hasValue(state.favoriteCustomers,nm)) return {ok:false,msg:'Already in favourites'}; if(state.favoriteCustomers.length>=5) return {ok:false,msg:'Maximum 5 favourites'}; state.favoriteCustomers.push(nm); save(state); return {ok:true}; },
    removeFavourite: function(name){ state.favoriteCustomers=(state.favoriteCustomers||[]).filter(function(n){return n!==name;}); save(state); },
    listProducts: function(){ return { 'Tydineal cream':700,'Tydisil Cream':945,'Anofast Gel':700,'Tydiclear Cream':515,'Tydibact Cream':580,'Borocare Cream':1520,'Klaract Cream':1565,'Ciprofloxacin Tablet':400,'Metformin Tablet':800,'Vitamin C Syrup':300,'Gentamicin Inj':5995,'Diclofenac Inj':4550,'Artemether Inj':4350,'M&B Isopropyl Alcohol':950 }; },
    setStock: function(ledger,product,price,qty){ ensureLedgerStock(ledger); var p=state.stock[ledger].products[product]||{price:0,qty:0}; if(price!=null && !Number.isNaN(Number(price))) p.price=Number(price); if(qty!=null && !Number.isNaN(Number(qty))) p.qty=Number(qty); state.stock[ledger].products[product]=p; save(state); },
    getStockForLedger: function(ledger){ ensureLedgerStock(ledger); var items=state.stock[ledger].products||{}; var out=[]; for(var name in items){ if(items.hasOwnProperty(name)){ var v=items[name]; var price=Number(v.price||0), qty=Number(v.qty||0); out.push({name:name,price:price,qty:qty,value:price*qty}); } } return out; },
    stockTotalValue: function(ledger){ var items=this.getStockForLedger(ledger)||[]; var s=0; for(var i=0;i<items.length;i++){ s+=items[i].value; } return s; },
    exportState: function(){ return JSON.parse(JSON.stringify(state)); },
    importState: function(obj){ try{ if(!obj||typeof obj!=='object') return {ok:false,msg:'Invalid file'}; if(!obj.ledgers||!obj.ledgers.length) return {ok:false,msg:'Missing ledgers'}; state.ledgers = []; for(var i=0;i<obj.ledgers.length;i++){ if(!hasValue(state.ledgers,obj.ledgers[i])) state.ledgers.push(obj.ledgers[i]); }
      state.payments = Array.isArray(obj.payments)? obj.payments : []; state.receivables = Array.isArray(obj.receivables)? obj.receivables : []; state.favoriteCustomers = Array.isArray(obj.favoriteCustomers)? obj.favoriteCustomers : []; state.stock = (obj.stock && typeof obj.stock==='object') ? obj.stock : {}; for(var j=0;j<state.ledgers.length;j++){ ensureLedgerStock(state.ledgers[j]); } save(state); return {ok:true}; } catch(e){ return {ok:false,msg:'Import failed'}; } },
    clearTransactionsAndStock: function(){ state.payments=[]; state.receivables=[]; for(var i=0;i<state.ledgers.length;i++){ var l=state.ledgers[i]; ensureLedgerStock(l); var prods=state.stock[l].products||{}; for(var k in prods){ if(prods.hasOwnProperty(k)) prods[k].qty=0; } state.stock[l].products=prods; } save(state); }
  };
})();
function naira(n){ return new Intl.NumberFormat('en-NG',{style:'currency',currency:'NGN',minimumFractionDigits:2}).format(Number(n||0)); }