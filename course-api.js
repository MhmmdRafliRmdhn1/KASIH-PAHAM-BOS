(function(){
if(typeof renderAllViews!=="function") return;
/* Integrasi Tugas 9: data bisnis dikelola backend, bukan localStorage. */
async function courseApi(url,method='GET',body) {
 const r=await fetch('/api/'+url,{method,headers:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});
 const data=await r.json();if(!r.ok)throw new Error(data.error||'API gagal');return data;
}
async function refreshCourse(){const s=await courseApi('state');products=s.products;customers=s.customers;transactions=s.transactions.filter(t=>t.status==='Selesai');}
initStorage=refreshCourse;
// Penggunaan lama tidak boleh menulis salinan bisnis di browser.
saveProducts=saveCustomers=saveTransactions=()=>{};
async function courseAction(fn){try{await fn();await refreshCourse();renderAllViews();}catch(e){showToast(e.message,'danger');}}
handleProductFormSubmit=async function(e){e.preventDefault();await courseAction(async()=>{
 const val=id=>document.getElementById(id).value;const id=val('prodEditId');
 await courseApi('products'+(id?'/'+id:''),id?'PUT':'POST',{name:val('prodName').trim(),sku:id?products.find(p=>p.id===id).sku:generateProductSku(val('prodName'),val('prodCategory'),''),category:val('prodCategory'),costPrice:Number(val('prodCostPrice')),sellPrice:Number(val('prodSellPrice')),stock:Number(val('prodStock')),minStock:Number(val('prodMinStock')),supplier:val('prodSupplier'),description:document.getElementById('prodDescription')?.value||''});closeModal('productModal');showToast('Produk disimpan di server','success');});};
deleteProduct=async id=>{if(confirm('Hapus produk ini?'))await courseAction(()=>courseApi('products/'+id,'DELETE'));};
let courseCustomerId=null;
const oldCustomerOpen=openAddCustomerModal;
openAddCustomerModal=function(){courseCustomerId=null;oldCustomerOpen();};
handleCustomerFormSubmit=async function(e){e.preventDefault();await courseAction(async()=>{
 await courseApi('customers'+(courseCustomerId?'/'+courseCustomerId:''),courseCustomerId?'PUT':'POST',{name:document.getElementById('custName').value.trim(),phone:document.getElementById('custPhone').value.trim(),notes:document.getElementById('custNotes').value});closeModal('customerModal');courseCustomerId=null;showToast('Pelanggan disimpan di server','success');});};
const oldCrmRender=renderCrmTable;
renderCrmTable=function(){oldCrmRender();const search=(document.getElementById('crmSearchInput').value||'').toLowerCase();const rows=[...document.querySelectorAll('#crmTableBody tr')];customers.filter(c=>c.name.toLowerCase().includes(search)||c.phone.includes(search)).forEach((c,i)=>{
 const cell=rows[i]?.lastElementChild;if(!cell)return;
 for(const [label,fn] of [['Edit',()=>{courseCustomerId=c.id;document.getElementById('customerModalTitle').textContent='Edit pelanggan';document.getElementById('custName').value=c.name;document.getElementById('custPhone').value=c.phone;document.getElementById('custNotes').value=c.notes;openModal('customerModal');}],['Hapus',()=>{if(confirm('Hapus pelanggan ini?'))courseAction(()=>courseApi('customers/'+c.id,'DELETE'));}]]){
 const b=document.createElement('button');b.className='btn btn-xs';b.textContent=label;b.onclick=fn;cell.appendChild(b);
 }
});};
let paymentBusy=false,pendingDraft=null;
processPayment=async function(){if(paymentBusy)return;paymentBusy=true;
 try{
  const body={customerId:currentCartCustomer==='guest'?null:currentCartCustomer,items:cart.map(i=>({id:i.id,qty:i.qty})),discountPct:Number(document.getElementById('cartDiscountPercent').value)||0,taxEnabled:document.getElementById('cartTaxToggle').checked};
  if(!pendingDraft)pendingDraft=await courseApi('transactions','POST',body);else pendingDraft=await courseApi('transactions/'+pendingDraft.id,'PUT',body);
  const method=document.querySelector('input[name="payMethod"]:checked').value.toUpperCase();
  const t=await courseApi('transactions/'+pendingDraft.id+'/checkout','POST',{method,cashPaid:Number(document.getElementById('cashReceivedInput').value)||0});
  pendingDraft=null;cart=[];lastCompletedTrx=t;await refreshCourse();renderAllViews();closeModal('checkoutModal');showReceiptModal(t);showToast('Pembayaran tercatat di server','success');
 }catch(e){showToast(e.message,'danger');}finally{paymentBusy=false;}
};
function courseEl(tag,text,parent){const e=document.createElement(tag);if(text)e.textContent=text;if(parent)parent.appendChild(e);return e;}
async function courseTransactions(){
 let overlay=document.getElementById('courseTransactions');if(overlay)overlay.remove();
 overlay=courseEl('dialog');overlay.id='courseTransactions';overlay.style.cssText='width:min(900px,94vw);max-height:90vh;overflow:auto;border:1px solid #345;border-radius:16px;background:#101d2b;color:white;padding:24px';document.body.appendChild(overlay);
 courseEl('h2','Kelola transaksi',overlay);courseEl('p','CRUD tersedia untuk draft. Transaksi selesai hanya dapat dilihat. Harga dan stok divalidasi server saat pembayaran.',overlay);
 const close=courseEl('button','Tutup',overlay);close.onclick=()=>overlay.close();
 try{
 const state=await courseApi('state');
 async function form(t){
  const area=courseEl('form',null,overlay);courseEl('h3',t?'Edit draft':'Tambah draft',area);
  const customer=courseEl('select',null,area);customer.appendChild(new Option('Pelanggan umum',''));state.customers.forEach(c=>customer.appendChild(new Option(c.name,c.id)));customer.value=t?.customerId||'';
  const fields=[];for(const p of state.products){const label=courseEl('label',p.name+' (stok '+p.stock+') ',area);label.style.display='block';const qty=courseEl('input',null,label);qty.type='number';qty.min='0';qty.step='1';qty.value=t?.items.find(i=>i.id===p.id)?.qty||0;fields.push([p.id,qty]);}
  const discount=courseEl('input',null,area);discount.type='number';discount.min='0';discount.max='100';discount.placeholder='Diskon %';discount.value=t?.discountPct||0;
  const label=courseEl('label',' PPN 11% ',area);const tax=courseEl('input',null,label);tax.type='checkbox';tax.checked=t?.taxEnabled||false;
  const save=courseEl('button','Simpan draft',area);save.type='submit';
  area.onsubmit=async e=>{e.preventDefault();save.disabled=true;try{await courseApi('transactions'+(t?'/'+t.id:''),t?'PUT':'POST',{customerId:customer.value||null,items:fields.filter(([,q])=>Number(q.value)>0).map(([id,q])=>({id,qty:Number(q.value)})),discountPct:Number(discount.value),taxEnabled:tax.checked});await refreshCourse();renderAllViews();courseTransactions();}catch(e){alert(e.message);save.disabled=false;}};
 }
 const add=courseEl('button','+ Tambah draft',overlay);add.onclick=()=>form();
 for(const t of state.transactions){const row=courseEl('section',null,overlay);row.style.cssText='padding:12px;border-bottom:1px solid #567';courseEl('p',t.id+' | '+t.customerName+' | '+t.status+' | '+formatRupiah(t.grandTotal),row);
 const detail=courseEl('button','Lihat detail',row);detail.onclick=()=>alert(t.items.map(i=>i.name+' × '+i.qty+' = '+formatRupiah(i.price*i.qty)).join('\n')+'\nTotal: '+formatRupiah(t.grandTotal));
 if(t.status==='Draft'){
 const edit=courseEl('button','Edit',row);edit.onclick=()=>form(t);
 const del=courseEl('button','Hapus',row);del.onclick=async()=>{if(!confirm('Hapus draft?'))return;try{await courseApi('transactions/'+t.id,'DELETE');if(pendingDraft?.id===t.id)pendingDraft=null;await refreshCourse();renderAllViews();courseTransactions();}catch(e){alert(e.message);}};
 const pay=courseEl('button','Bayar tunai',row);pay.onclick=async()=>{const v=prompt('Uang diterima (angka rupiah):',String(t.grandTotal));if(v===null)return;try{await courseApi('transactions/'+t.id+'/checkout','POST',{method:'CASH',cashPaid:Number(v)});await refreshCourse();renderAllViews();courseTransactions();}catch(e){alert(e.message);}};
 }
 }
 }catch(e){courseEl('p',e.message,overlay);}overlay.showModal();
}
document.addEventListener('DOMContentLoaded',()=>{
 const b=courseEl('button','Kelola transaksi');b.className='btn btn-primary';b.style.cssText='position:fixed;bottom:18px;left:18px;z-index:1000';b.onclick=courseTransactions;document.body.appendChild(b);
 // Import/reset lama memodifikasi data di browser; tidak sesuai sumber data server.
 for(const id of ['btnImportData','btnClearAllData','btnResetData','btnResetSeed']){const el=document.getElementById(id);if(el){el.disabled=true;el.title='Tidak tersedia pada versi data server';}}
});

})();

if(typeof renderAllViews==='function') {
 importDataBackup=resetToDemoData=()=>showToast('Gunakan CRUD data server pada versi tugas.','info');
 applyAiDescriptionToSelectedProduct=async()=>{
  const p=products.find(p=>p.id===document.getElementById('aiCopySelectProduct')?.value);
  if(p&&lastGeneratedAiCopy)try { await fetch('/api/products/'+p.id,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({...p,description:lastGeneratedAiCopy.text})}).then(async r=>{if(!r.ok)throw Error((await r.json()).error);}); p.description=lastGeneratedAiCopy.text;renderAllViews();showToast('Deskripsi disimpan di server','success'); }catch(e){showToast(e.message,'danger');}
 };
}
