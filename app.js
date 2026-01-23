
if('serviceWorker' in navigator){ window.addEventListener('load', ()=>{ navigator.serviceWorker.register('./service-worker.js'); }); }

// Tabs
const tabButtons = document.querySelectorAll('.tab-btn');
const panels = document.querySelectorAll('.tab-panel');
function showTab(name){ tabButtons.forEach(b=>{ b.classList.toggle('active', b.dataset.tab===name); b.setAttribute('aria-selected', b.dataset.tab===name ? 'true':'false'); }); panels.forEach(p=>p.classList.toggle('active', p.id===name)); }

tabButtons.forEach(btn=>btn.addEventListener('click', ()=>showTab(btn.dataset.tab)));
showTab('payments');

// Ledger selects
const ledgerSelects = {
  payment: document.getElementById('payment-ledger'),
  paymentsFilter: document.getElementById('payments-filter-ledger'),
  recv: document.getElementById('recv-ledger'),
  recvFilter: document.getElementById('recv-filter-ledger'),
  stock: document.getElementById('stock-ledger'),
  dashboard: document.getElementById('dash-ledger'),
};

function refreshLedgers(){
  const ledgers = Store.getLedgers();
  Object.values(ledgerSelects).forEach(sel=>{
    if(!sel) return; const current = sel.value; sel.innerHTML='';
    if(sel===ledgerSelects.paymentsFilter || sel===ledgerSelects.recvFilter){ const optAll=document.createElement('option'); optAll.value='All'; optAll.textContent='All'; sel.appendChild(optAll); }
    for(const l of ledgers){ const opt=document.createElement('option'); opt.value=l; opt.textContent=l; sel.appendChild(opt); }
    if(current && Array.from(sel.options).some(o=>o.value===current)) sel.value=current;
  });
  const list = document.getElementById('ledger-list'); list.innerHTML='';
  ledgers.forEach(l=>{ const span=document.createElement('span'); span.className='pill'; span.textContent=l; list.appendChild(span); });
}

// Add ledger
const addLedgerBtn = document.getElementById('add-ledger-btn');
addLedgerBtn.addEventListener('click', ()=>{
  const name = document.getElementById('new-ledger-name').value; const res = Store.addLedger(name);
  if(!res.ok){ alert(res.msg); return; }
  document.getElementById('new-ledger-name').value='';
  refreshLedgers(); refreshDashboard(); refreshPaymentsTable(); refreshReceivables(); refreshStockTable();
});

refreshLedgers();

// Payment form toggle
const creditFields = document.getElementById('credit-fields');
const debitFields = document.getElementById('debit-fields');
document.querySelectorAll('input[name="pay-kind"]').forEach(r=>{ r.addEventListener('change', ()=>{ if(r.checked){ const v=r.value; creditFields.classList.toggle('hidden', v!=='credit'); debitFields.classList.toggle('hidden', v!=='debit'); } }); });

// Add Credit
const addCreditBtn = document.getElementById('add-credit-btn');
addCreditBtn.addEventListener('click', ()=>{
  const ledger = ledgerSelects.payment.value; const date = (document.getElementById('payment-date').value || new Date().toISOString().slice(0,10));
  const name = document.getElementById('credit-name').value.trim(); const paymentType = document.getElementById('credit-type').value; const amount = Number(document.getElementById('credit-amount').value);
  if(!ledger){ alert('Select a ledger'); return; }
  if(!amount){ alert('Enter amount'); return; }
  Store.addCredit({ date, name, paymentType, amount, ledger });
  document.getElementById('credit-name').value=''; document.getElementById('credit-amount').value='';
  refreshPaymentsTable(); refreshDashboard();
});

// Add Debit
const addDebitBtn = document.getElementById('add-debit-btn');
addDebitBtn.addEventListener('click', ()=>{
  const ledger = ledgerSelects.payment.value; const date = (document.getElementById('payment-date').value || new Date().toISOString().slice(0,10));
  const invoiceType = document.getElementById('debit-invoice-type').value.trim(); const invoiceNumber = document.getElementById('debit-invoice-number').value.trim(); const amount = Number(document.getElementById('debit-amount').value);
  if(!ledger){ alert('Select a ledger'); return; }
  if(!amount){ alert('Enter amount'); return; }
  Store.addDebit({ date, invoiceType, invoiceNumber, amount, ledger });
  document.getElementById('debit-invoice-type').value=''; document.getElementById('debit-invoice-number').value=''; document.getElementById('debit-amount').value='';
  refreshPaymentsTable(); refreshDashboard();
});

// Payments table
const paymentsFilter = ledgerSelects.paymentsFilter; paymentsFilter.addEventListener('change', refreshPaymentsTable);
function refreshPaymentsTable(){
  const ledger = paymentsFilter.value || 'All';
  const rows = Store.listPayments(ledger);
  const wrap = document.getElementById('payments-table');
  let html = '<table><thead><tr><th>Date</th><th>Type</th><th>Details</th><th>Ledger</th><th>Amount</th><th></th></tr></thead><tbody>';
  for(const r of rows){
    let details=''; if(r.type==='credit') details = `${r.name||''} · ${r.paymentType||''}`; else details = `${r.invoiceType||''} · #${r.invoiceNumber||''}`;
    html += `<tr><td>${r.date||''}</td><td>${r.type}</td><td>${details}</td><td>${r.ledger}</td><td>${naira(r.amount)}</td><td><button class="danger" data-del="${r.id}">Delete</button></td></tr>`;
  }
  html += '</tbody></table>';
  wrap.innerHTML = html;
  wrap.querySelectorAll('button[data-del]').forEach(btn=>{ btn.addEventListener('click', ()=>{ if(confirm('Delete entry?')){ Store.deletePayment(btn.dataset.del); refreshPaymentsTable(); refreshDashboard(); } }); });

  // Update summary totals based on selected ledger
  let totalCredits = 0, totalDebits = 0;
  if(ledger === 'All'){
    for(const r of rows){ if(r.type==='credit') totalCredits += Number(r.amount||0); else totalDebits += Number(r.amount||0);}  
  } else {
    const t = Store.paymentsTotals(ledger); totalCredits = t.credits; totalDebits = t.debits;
  }
  const bal = totalDebits - totalCredits;
  const elC = document.getElementById('payments-total-credits');
  const elD = document.getElementById('payments-total-debits');
  const elB = document.getElementById('payments-balance');
  if(elC) elC.textContent = naira(totalCredits);
  if(elD) elD.textContent = naira(totalDebits);
  if(elB){ elB.textContent = naira(bal); elB.style.color = bal>0 ? '#22c55e' : bal<0 ? '#ef4444' : '#e5e7eb'; }
}

// Export CSV for selected ledger (payments)
const exportBtn = document.getElementById('export-ledger-csv');
exportBtn.addEventListener('click', ()=>{
  const ledger = (paymentsFilter.value==='All' || !paymentsFilter.value) ? ledgerSelects.payment.value : paymentsFilter.value;
  if(!ledger){ alert('Select a ledger to export'); return; }
  const rows = Store.listPayments(ledger);
  const header = ['Date','Type','Payment Name/Invoice Type','Payment Type/Invoice #','Ledger','Amount'];
  const lines = [header.join(',')];
  for(const r of rows){
    if(r.type==='credit') lines.push([r.date,'Credit',(r.name||''),(r.paymentType||''),r.ledger,r.amount].map(v=>`"${String(v??'').replaceAll('"','""')}"`).join(',')); else lines.push([r.date,'Debit',(r.invoiceType||''),(r.invoiceNumber||''),r.ledger,r.amount].map(v=>`"${String(v??'').replaceAll('"','""')}"`).join(','));
  }
  const blob = new Blob([lines.join('\n')], { type:'text/csv;charset=utf-8;' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download=`ledger_${ledger}_statement.csv`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
});

// Receivables
const RECV_PAGE_SIZE = 10; let recvPage = 1;
const addRecvBtn = document.getElementById('add-recv-btn');
addRecvBtn.addEventListener('click', ()=>{
  const ledger = ledgerSelects.recv.value; const date = (document.getElementById('recv-date').value || new Date().toISOString().slice(0,10));
  const customer = document.getElementById('recv-customer').value.trim(); const invoiceNumber = document.getElementById('recv-invnum').value.trim();
  const amount = Number(document.getElementById('recv-amount').value); const comment = document.getElementById('recv-comment').value.trim();
  if(!ledger){ alert('Select a ledger'); return; } if(!customer){ alert('Enter customer'); return; } if(!amount){ alert('Enter amount'); return; }
  Store.addReceivable({ date, customer, invoiceNumber, amount, comment, ledger });
  document.getElementById('recv-customer').value=''; document.getElementById('recv-invnum').value=''; document.getElementById('recv-amount').value=''; document.getElementById('recv-comment').value='';
  refreshReceivables(); refreshDashboard();
});

ledgerSelects.recvFilter.addEventListener('change', ()=>{ recvPage=1; refreshReceivables(); });
function refreshReceivables(){
  const ledger = ledgerSelects.recvFilter.value || 'All';
  const fullRows = Store.listReceivables(ledger);
  const wrap = document.getElementById('receivables-table');
  const totalAmt = fullRows.reduce((s,r)=>s+Number(r.amount||0),0);
  const totalEl = document.getElementById('receivables-total'); if(totalEl) totalEl.textContent = `Total: ${naira(totalAmt)}`;
  const totalPages = Math.max(1, Math.ceil(fullRows.length / RECV_PAGE_SIZE));
  if(recvPage>totalPages) recvPage = totalPages; const start = (recvPage-1)*RECV_PAGE_SIZE; const rows = fullRows.slice(start, start+RECV_PAGE_SIZE);
  let html = '<table><thead><tr><th>Date</th><th>Customer</th><th>Invoice #</th><th>Ledger</th><th>Amount</th><th>Comment</th><th></th><th></th></tr></thead><tbody>';
  for(const r of rows){ html += `<tr><td>${r.date||''}</td><td>${r.customer||''}</td><td>${r.invoiceNumber||''}</td><td>${r.ledger}</td><td>${naira(r.amount)}</td><td>${r.comment||''}</td><td><button class="outline" data-edit="${r.id}">Edit</button></td><td><button class="danger" data-del="${r.id}">Delete</button></td></tr>`; }
  html += '</tbody></table>'; wrap.innerHTML = html;
  wrap.querySelectorAll('button[data-del]').forEach(btn=>{ btn.addEventListener('click', ()=>{ if(confirm('Delete receivable?')){ Store.deleteReceivable(btn.dataset.del); refreshReceivables(); refreshDashboard(); } }); });
  wrap.querySelectorAll('button[data-edit]').forEach(btn=>{ btn.addEventListener('click', ()=> openEditModal(btn.dataset.edit)); });
  const prev = document.getElementById('recv-prev'); const next = document.getElementById('recv-next'); const info = document.getElementById('recv-page-info');
  if(prev&&next&&info){ info.textContent = `Page ${recvPage}/${totalPages}`; prev.disabled = recvPage<=1; next.disabled = recvPage>=totalPages; prev.onclick = ()=>{ if(recvPage>1){ recvPage--; refreshReceivables(); } }; next.onclick = ()=>{ if(recvPage<totalPages){ recvPage++; refreshReceivables(); } }; }
  // Favourite sections
  refreshFavouriteSections();
}

// Receivables export (CSV)
const exportRecvBtn = document.getElementById('export-recv-csv');
if(exportRecvBtn){
  exportRecvBtn.addEventListener('click', ()=>{
    const ledger = ledgerSelects.recvFilter.value || 'All';
    const rows = Store.listReceivables(ledger);
    const header = ['Date','Customer','Invoice #','Ledger','Amount','Comment'];
    const lines = [header.join(',')];
    for(const r of rows){ lines.push([r.date, r.customer||'', r.invoiceNumber||'', r.ledger, r.amount, r.comment||''].map(v=>`"${String(v??'').replaceAll('"','""')}"`).join(',')); }
    const blob = new Blob([lines.join('\n')], { type:'text/csv;charset=utf-8;' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download = `receivables_${ledger}.csv`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  });
}

function renderFavourites(){ const favWrap = document.getElementById('fav-customers'); favWrap.innerHTML=''; for(const name of Store.getFavourites()){ const span=document.createElement('span'); span.className='pill'; span.textContent = name + ' '; const btn=document.createElement('button'); btn.className='danger'; btn.textContent='×'; btn.style.marginLeft='.5rem'; btn.addEventListener('click', ()=>{ Store.removeFavourite(name); renderFavourites(); refreshFavouriteSections(); }); span.appendChild(btn); favWrap.appendChild(span); } }
const addFavBtn = document.getElementById('add-fav-btn'); addFavBtn.addEventListener('click', ()=>{ const name = document.getElementById('new-fav-name').value; const res = Store.addFavourite(name); if(!res.ok){ alert(res.msg); return; } document.getElementById('new-fav-name').value=''; renderFavourites(); refreshFavouriteSections(); });

function refreshFavouriteSections(){
  const FAV_PAGE_SIZE = 10; window.__favPages = window.__favPages || {};
  const favs = Store.getFavourites(); const box = document.getElementById('fav-recv-container'); box.innerHTML = '';
  if(favs.length===0){ box.innerHTML = '<p class="small">No favourites yet. Add up to 5 customers to track their receivables separately.</p>'; return; }
  const all = Store.listReceivables('All');
  for(const name of favs){ if(!(name in window.__favPages)) window.__favPages[name]=1; const allRows = all.filter(r=>r.customer===name); const totalPages = Math.max(1, Math.ceil(allRows.length / FAV_PAGE_SIZE)); if(window.__favPages[name]>totalPages) window.__favPages[name]=totalPages; const start=(window.__favPages[name]-1)*FAV_PAGE_SIZE; const rows = allRows.slice(start, start+FAV_PAGE_SIZE);
    let html = `<div class="card" style="margin:.5rem 0"><h4>${name}</h4><div class="table">`;
    if(rows.length===0){ html += `<p class="small">No receivables yet.</p>`; }
    else { html += '<table><thead><tr><th>Date</th><th>Invoice #</th><th>Ledger</th><th>Amount</th><th>Comment</th></tr></thead><tbody>'; for(const r of rows){ html += `<tr><td>${r.date||''}</td><td>${r.invoiceNumber||''}</td><td>${r.ledger}</td><td>${naira(r.amount)}</td><td>${r.comment||''}</td></tr>`; } html += '</tbody></table>'; }
    const total = allRows.reduce((s,r)=>s+Number(r.amount||0),0); html += `<div class="pill" style="margin-top:.5rem">Total: ${naira(total)}</div>`;
    html += `<div class="row wrap" style="margin-top:.5rem"><span class="small">Page ${window.__favPages[name]}/${totalPages}</span><div style="margin-left:auto; display:flex; gap:.5rem"><button class="outline" data-favprev="${name}">Prev</button><button class="outline" data-favnext="${name}">Next</button></div></div>`; html += '</div></div>';
    const div = document.createElement('div'); div.innerHTML = html; box.appendChild(div); const prevBtn = div.querySelector(`button[data-favprev="${name}"]`); const nextBtn = div.querySelector(`button[data-favnext="${name}"]`); if(prevBtn) prevBtn.addEventListener('click', ()=>{ if(window.__favPages[name]>1){ window.__favPages[name]--; refreshFavouriteSections(); } }); if(nextBtn) nextBtn.addEventListener('click', ()=>{ if(window.__favPages[name]<totalPages){ window.__favPages[name]++; refreshFavouriteSections(); } }); }
}

renderFavourites(); refreshReceivables();

// Stock
const productSelect = document.getElementById('stock-product');
function populateProducts(){ const products = Store.listProducts(); productSelect.innerHTML = ''; for(const [name, price] of Object.entries(products)){ const opt=document.createElement('option'); opt.value=name; opt.textContent=name; opt.dataset.price=price; productSelect.appendChild(opt);} syncPriceFromProduct(); }
function syncPriceFromProduct(){ const sel = productSelect.options[productSelect.selectedIndex]; document.getElementById('stock-price').value = sel?.dataset?.price || 0; }
productSelect.addEventListener('change', syncPriceFromProduct);
function refreshStockTable(){ const ledger = ledgerSelects.stock.value; const items = Store.getStockForLedger(ledger); const wrap = document.getElementById('stock-table'); let html = '<table><thead><tr><th>Product</th><th>Price (₦)</th><th>Qty</th><th>Value</th></tr></thead><tbody>'; for(const it of items){ html += `<tr><td>${it.name}</td><td>${naira(it.price)}</td><td>${it.qty}</td><td>${naira(it.value)}</td></tr>`; } html += '</tbody></table>'; wrap.innerHTML = html; document.getElementById('stock-total').textContent = `Total Value: ${naira(items.reduce((s,x)=>s+x.value,0))}`; refreshDashboard(); }
const addStockBtn = document.getElementById('add-stock-btn'); addStockBtn.addEventListener('click', ()=>{ const ledger = ledgerSelects.stock.value; const product = productSelect.value; const price = Number(document.getElementById('stock-price').value); const qty = Number(document.getElementById('stock-qty').value); if(!ledger){ alert('Select a ledger'); return; } if(!product){ alert('Select a product'); return; } Store.setStock(ledger, product, price, qty); document.getElementById('stock-qty').value=''; refreshStockTable(); });

// Dashboard
function refreshDashboard(){ const ledger = ledgerSelects.dashboard.value || Store.getLedgers()[0]; const { credits, debits } = Store.paymentsTotals(ledger); const recv = Store.receivablesTotal(ledger); const stock = Store.stockTotalValue(ledger); const profit = (credits + recv + stock) - debits; document.getElementById('stat-debits').textContent = naira(debits); document.getElementById('stat-credits').textContent = naira(credits); document.getElementById('stat-recv').textContent = naira(recv); document.getElementById('stat-stock').textContent = naira(stock); const w = document.getElementById('business-worth'); w.textContent = naira(profit); w.style.background = '#6b7280'; w.style.color = profit>0 ? '#22c55e' : profit<0 ? '#ef4444' : '#ffffff'; }
ledgerSelects.dashboard.addEventListener('change', refreshDashboard); ledgerSelects.stock.addEventListener('change', refreshStockTable);

populateProducts(); refreshLedgers(); if(ledgerSelects.payment.options.length>0) ledgerSelects.payment.selectedIndex = 0; if(ledgerSelects.paymentsFilter.options.length>0) ledgerSelects.paymentsFilter.selectedIndex = 0; if(ledgerSelects.recv.options.length>0) ledgerSelects.recv.selectedIndex = 0; if(ledgerSelects.recvFilter.options.length>0) ledgerSelects.recvFilter.selectedIndex = 0; if(ledgerSelects.stock.options.length>0) ledgerSelects.stock.selectedIndex = 0; if(ledgerSelects.dashboard.options.length>0) ledgerSelects.dashboard.selectedIndex = 0; refreshPaymentsTable(); refreshStockTable(); refreshDashboard();
