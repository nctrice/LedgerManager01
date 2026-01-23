const Store = (()=>{ const KEY='ledgerpwa.v1';
  const defaultProducts={ 'Tydineal cream':700,'Tydisil Cream':945,'Anofast Gel':700,'Tydiclear Cream':515,'Tydibact Cream':580,'Borocare Cream':1520,'Klaract Cream':1565,'Ciprofloxacin Tablet':400,'Metformin Tablet':800,'Vitamin C Syrup':300,'Gentamicin Inj':5995,'Diclofenac Inj':4550,'Artemether Inj':4350,'M&B Isopropyl Alcohol':950 };
  function load(){ try{ return JSON.parse(localStorage.getItem(KEY))||{ ledgers:['General'], payments:[], receivables:[], favoriteCustomers:[], stock:{ 'General':{ products:Object.fromEntries(Object.entries(defaultProducts).map(([n,p])=>[n,{price:p,qty:0}])) } } }; }catch(e){ return { ledgers:['General'], payments:[], receivables:[], favoriteCustomers:[], stock:{ 'General':{ products:{} } } }; } }
  function save(s){ localStorage.setItem(KEY, JSON.stringify(s)); }
  const state=load();
  function ensureLedgerStock(ledger){ if(!state.stock[ledger]) state.stock[ledger]={products:{}}; for(const [n,p] of Object.entries(defaultProducts)){ if(!state.stock[ledger].products[n]) state.stock[ledger].products[n]={price:p,qty:0}; } }
  return {
    getLedgers: ()=> Array.from(state.ledgers),
    addLedger: (name)=>{ const nm=String(name||'').trim(); if(!nm) return {ok:false,msg:'Enter a name'}; if(state.ledgers.includes(nm)) return {ok:false,msg:'Ledger already exists'}; state.ledgers.push(nm); ensureLedgerStock(nm); save(state); return {ok:true}; },
    // PAYMENTS
    addCredit: ({date,name,paymentType,amount,ledger})=>{ const id=crypto.randomUUID(); const createdAt=new Date().toISOString(); const amt=Number(amount||0); state.payments.push({id,type:'credit',date,name:name||'',paymentType:paymentType||'Transfer',amount:amt,ledger,createdAt}); save(state); },
    addDebit: ({date,invoiceType,invoiceNumber,amount,ledger})=>{ const id=crypto.randomUUID(); const createdAt=new Date().toISOString(); const amt=Number(amount||0); state.payments.push({id,type:'debit',date,invoiceType:invoiceType||'',invoiceNumber:invoiceNumber||'',amount:amt,ledger,createdAt}); save(state); },
    deletePayment: (id)=>{ const i=state.payments.findIndex(p=>p.id===id); if(i>=0){ state.payments.splice(i,1); save(state);} },
    listPayments: (ledger=null)=>{ let arr=Array.from(state.payments); if(ledger&&ledger!=='All') arr=arr.filter(p=>p.ledger===ledger); arr.sort((a,b)=>{ const ad=a.date||a.createdAt; const bd=b.date||b.createdAt; return bd.localeCompare(ad); }); return arr; },
    paymentsTotals: (ledger)=>{ if(ledger==='All'||!ledger){ let c=0,d=0; for(const p of state.payments){ if(p.type==='credit') c+=Number(p.amount||0); else d+=Number(p.amount||0);} return {credits:c,debits:d}; } const arr=state.payments.filter(p=>p.ledger===ledger); let c=0,d=0; for(const p of arr){ if(p.type==='credit') c+=Number(p.amount||0); else d+=Number(p.amount||0);} return {credits:c,debits:d}; },
    // RECEIVABLES
    addReceivable: ({date,customer,invoiceNumber,amount,comment,ledger})=>{ const id=crypto.randomUUID(); const createdAt=new Date().toISOString(); const amt=Number(amount||0); state.receivables.push({id,date,customer:customer||'',invoiceNumber:invoiceNumber||'',amount:amt,comment:comment||'',ledger,createdAt}); save(state); },
    deleteReceivable: (id)=>{ const i=state.receivables.findIndex(r=>r.id===id); if(i>=0){ state.receivables.splice(i,1); save(state);} },
    updateReceivable: (id,fields)=>{ const it=state.receivables.find(r=>r.id===id); if(it){ Object.assign(it,fields); save(state);} },
    listReceivables: (ledger=null)=>{ let arr=Array.from(state.receivables); if(ledger&&ledger!=='All') arr=arr.filter(r=>r.ledger===ledger); arr.sort((a,b)=>{ const ad=a.date||a.createdAt; const bd=b.date||b.createdAt; return bd.localeCompare(ad); }); return arr; },
    receivablesTotal: (ledger)=> state.receivables.filter(r=>r.ledger===ledger).reduce((s,r)=>s+Number(r.amount||0),0),
    // FAVOURITES
    getFavourites: ()=> Array.from(state.favoriteCustomers||[]),
    addFavourite: (name)=>{ const nm=String(name||'').trim(); if(!nm) return {ok:false,msg:'Enter a name'}; if(state.favoriteCustomers.includes(nm)) return {ok:false,msg:'Already in favourites'}; if(state.favoriteCustomers.length>=5) return {ok:false,msg:'Maximum 5 favourites'}; state.favoriteCustomers.push(nm); save(state); return {ok:true}; },
    removeFavourite: (name)=>{ state.favoriteCustomers=state.favoriteCustomers.filter(n=>n!==name); save(state); },
    // STOCK
    listProducts: ()=> defaultProducts,
    setStock: (ledger,product,price,qty)=>{ ensureLedgerStock(ledger); const p=state.stock[ledger].products[product]||{price:0,qty:0}; if(price!=null&&!Number.isNaN(Number(price))) p.price=Number(price); if(qty!=null&&!Number.isNaN(Number(qty))) p.qty=Number(qty); state.stock[ledger].products[product]=p; save(state); },
    getStockForLedger: (ledger)=>{ ensureLedgerStock(ledger); const items=state.stock[ledger].products||{}; return Object.entries(items).map(([name,v])=>({name,price:Number(v.price||0),qty:Number(v.qty||0),value:Number(v.price||0)*Number(v.qty||0)})); },
    stockTotalValue: (ledger)=> (Store.getStockForLedger(ledger)||[]).reduce((s,it)=>s+it.value,0),
  };
})();
function naira(n){ return new Intl.NumberFormat('en-NG',{style:'currency',currency:'NGN',minimumFractionDigits:2}).format(Number(n||0)); }
