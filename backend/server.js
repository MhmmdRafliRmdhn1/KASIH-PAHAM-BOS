'use strict';
// Tugas 9: seluruh data bisnis hardcoded di memori, tanpa database.
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const {randomUUID} = require('node:crypto');
const root = path.resolve(__dirname, '..');
function createApp() {
 const data = {products: [], customers: [], transactions: []};
 const fail = (message, status=400) => {throw Object.assign(new Error(message), {status});};
 const number = (v, name, integer=false) => {if (typeof v !== 'number' || !Number.isFinite(v) || v<0 || (integer&&!Number.isSafeInteger(v))) fail(name+' tidak valid');return v;};
 const name = v => {if(typeof v!=='string'||!v.trim()||v.length>200)fail('Nama wajib diisi (maksimal 200 karakter)');return v.trim();};
 function draft(b) {
  const customer = b.customerId ? data.customers.find(c=>c.id===b.customerId) : null;
  if(b.customerId&&!customer)fail('Pelanggan tidak ditemukan');
  if(!Array.isArray(b.items)||!b.items.length)fail('Pilih minimal satu produk');
  const seen=new Set();
  const items=b.items.map(i=>{
   const p=data.products.find(p=>p.id===i.id);if(!p)fail('Produk tidak ditemukan');
   if(seen.has(p.id))fail('Produk duplikat');seen.add(p.id);
   const qty=number(i.qty,'Jumlah',true);if(!qty)fail('Jumlah harus lebih dari nol');
   return {id:p.id,name:p.name,price:p.sellPrice,costPrice:p.costPrice,qty};
  });
  const discountPct=number(b.discountPct??0,'Diskon');if(discountPct>100)fail('Diskon maksimal 100%');
  const subtotal=items.reduce((s,i)=>s+i.price*i.qty,0),discount=Math.round(subtotal*discountPct/100),tax=b.taxEnabled===true?Math.round((subtotal-discount)*.11):0;
  return {customerId:customer?.id??null,customerName:customer?.name??'Umum (Guest)',customerPhone:customer?.phone??'',items,discountPct,taxEnabled:b.taxEnabled===true,subtotal,discount,tax,grandTotal:subtotal-discount+tax};
 }
 return http.createServer(async(req,res)=>{
  const send=(status,b)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(b));};
  try {
   const url=new URL(req.url,'http://localhost');const parts=url.pathname.split('/').filter(Boolean);
   if(parts[0]==='api') {
    if(req.method==='GET'&&parts[1]==='health')return send(200,{status:'ok',storage:'in-memory JSON'});
    if(req.method==='GET'&&parts[1]==='state')return send(200,data);
    const entity=parts[1],list=data[entity];if(!list)fail('Endpoint tidak ditemukan',404);
    let body={};if(['POST','PUT'].includes(req.method)) {
     let raw='';for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>262144)fail('Request terlalu besar',413);}
     try{body=JSON.parse(raw||'{}');}catch{fail('JSON tidak valid');}
     if(!body||typeof body!=='object'||Array.isArray(body))fail('Objek JSON diperlukan');
    }
    const id=parts[2],item=id?list.find(x=>x.id===id):null;
    if(id&&!item)fail('Data tidak ditemukan',404);
    if(parts.length>3 && !(entity==='transactions'&&parts[3]==='checkout'&&parts.length===4&&req.method==='POST'))fail('Endpoint tidak ditemukan',404);
    if(req.method==='GET')return send(200,id?item:list);
    if(entity==='transactions'&&id&&parts[3]==='checkout') {
     if(item.status!=='Draft')fail('Transaksi sudah diproses',409);
     const fresh=draft(item);
     for(const i of fresh.items)if(data.products.find(p=>p.id===i.id).stock<i.qty)fail('Stok '+i.name+' tidak cukup',409);
     const method=String(body.method||'CASH').toUpperCase();if(!['CASH','QRIS','TRANSFER'].includes(method))fail('Metode pembayaran tidak valid');
     const paid=method==='CASH'?number(body.cashPaid,'Uang diterima'):fresh.grandTotal;if(paid<fresh.grandTotal)fail('Uang diterima kurang');
     // Tidak ada await di antara validasi dan perubahan: satu proses, satu operasi sinkron.
     for(const i of fresh.items)data.products.find(p=>p.id===i.id).stock-=i.qty;
     const c=data.customers.find(c=>c.id===fresh.customerId);if(c){c.totalSpent+=fresh.grandTotal;c.points+=Math.floor(fresh.grandTotal/10000);c.lastVisit=new Date().toISOString().slice(0,10);}
     Object.assign(item,fresh,{status:'Selesai',method,cashPaid:paid,cashChange:paid-fresh.grandTotal});return send(200,item);
    }
    if(req.method==='DELETE') {
     if(!id)fail('ID diperlukan');
     if(entity==='transactions'&&item.status!=='Draft')fail('Hanya draft yang boleh dihapus',409);
     if(entity==='products'&&data.transactions.some(t=>t.items.some(i=>i.id===id)))fail('Produk sudah digunakan transaksi',409);
     if(entity==='customers'&&data.transactions.some(t=>t.customerId===id))fail('Pelanggan sudah digunakan transaksi',409);
     list.splice(list.indexOf(item),1);return send(200,{ok:true});
    }
    if(!['POST','PUT'].includes(req.method)||req.method==='PUT'&&!id||req.method==='POST'&&id)fail('Metode tidak diizinkan',405);
    let value;
    if(entity==='products') {
     const sku=name(body.sku);if(list.some(p=>p.sku===sku&&p!==item))fail('SKU sudah digunakan',409);
     value={name:name(body.name),sku,category:String(body.category||'Lainnya'),costPrice:number(body.costPrice,'Harga modal'),sellPrice:number(body.sellPrice,'Harga jual'),stock:number(body.stock,'Stok',true),minStock:number(body.minStock??5,'Stok minimum',true),supplier:String(body.supplier||''),description:String(body.description||''),icon:'auto'};
    } else if(entity==='customers') {
     const phone=String(body.phone||'').trim();if(!/^\+?[\d\s-]{8,20}$/.test(phone))fail('Nomor telepon tidak valid');
     if(list.some(c=>c.phone===phone&&c!==item))fail('Telepon sudah terdaftar',409);
     value={name:name(body.name),phone,notes:String(body.notes||''),totalSpent:item?.totalSpent??0,points:item?.points??0,lastVisit:item?.lastVisit??''};
    } else {
     if(item&&item.status!=='Draft')fail('Hanya draft yang boleh diubah',409);
     value={...draft(body),status:'Draft',date:item?.date??new Date().toISOString().slice(0,10),time:item?.time??new Date().toLocaleTimeString('id-ID'),method:'-',cashPaid:0,cashChange:0};
    }
    if(item){Object.assign(item,value);return send(200,item);}
    const created={...value,id:randomUUID()};list.push(created);return send(201,created);
   }
   if(!['GET','HEAD'].includes(req.method))fail('Metode tidak diizinkan',405);
   let file=decodeURIComponent(url.pathname);if(file==='/')file='/index.html';
   // Hanya frontend dipublikasikan. Backend, database, .git dan konfigurasi tidak dilayani.
   if(!(/^\/(index|login|register)\.html$/.test(file)||/^\/[\w-]+\.(css|js|ico)$/.test(file)||file.startsWith('/assets/')))fail('Tidak ditemukan',404);
   const target=path.resolve(root,'.'+file);if(!target.startsWith(root+path.sep))fail('Tidak ditemukan',404);
   const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon','.woff2':'font/woff2','.jpg':'image/jpeg'};
   const bytes=await fs.readFile(target);res.writeHead(200,{'Content-Type':(mime[path.extname(target)]||'application/octet-stream'),'X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?undefined:bytes);
  }catch(e){send(e.status||(e.code==='ENOENT'?404:500),{error:e.status?e.message:e.code==='ENOENT'?'Tidak ditemukan':'Terjadi kesalahan server'});}
 });
}
if(require.main===module)createApp().listen(Number(process.env.PORT||3001),process.env.HOST||'127.0.0.1',()=>console.log('TransformaUMKM http://127.0.0.1:'+(process.env.PORT||3001)));
module.exports={createApp};
