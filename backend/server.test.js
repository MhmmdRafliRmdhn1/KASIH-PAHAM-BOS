const {test}=require('node:test');const assert=require('node:assert/strict');const {createApp}=require('./server');
test('CRUD tiga entitas, checkout atomik dan larangan akses file backend',async()=>{
 const s=createApp();await new Promise(r=>s.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+s.address().port;
 async function api(p,m='GET',b,status=200){const r=await fetch(base+'/api/'+p,{method:m,headers:{'Content-Type':'application/json'},body:b===undefined?undefined:JSON.stringify(b)});const x=await r.json();assert.equal(r.status,status,JSON.stringify(x));return x;}
 try{
 const p=await api('products','POST',{name:'Kopi',sku:'K01',costPrice:6000,sellPrice:10000,stock:5},201);
 const c=await api('customers','POST',{name:'Budi',phone:'081234567890'},201);
 await api('products/'+p.id,'PUT',{...p,stock:6});await api('customers/'+c.id,'PUT',{...c,name:'Budi Baru'});
 const t=await api('transactions','POST',{customerId:c.id,items:[{id:p.id,qty:2}],grandTotal:1},201);assert.equal(t.grandTotal,20000);
 await api('transactions/'+t.id,'PUT',{items:[{id:p.id,qty:3}],customerId:c.id});
 await api('transactions/'+t.id+'/checkout','POST',{method:'CASH',cashPaid:1},400);assert.equal((await api('products/'+p.id)).stock,6);
 await api('transactions/'+t.id+'/checkout','POST',{method:'CASH',cashPaid:30000});assert.equal((await api('products/'+p.id)).stock,3);assert.equal((await api('customers/'+c.id)).points,3);
 await api('transactions/'+t.id+'/checkout','POST',{method:'CASH',cashPaid:30000},409);
 await api('products/'+p.id,'DELETE',undefined,409);await api('customers/'+c.id,'DELETE',undefined,409);await api('transactions/'+t.id,'DELETE',undefined,409);
 const d=await api('transactions','POST',{items:[{id:p.id,qty:4}]},201);await api('transactions/'+d.id+'/checkout','POST',{method:'CASH',cashPaid:50000},409);assert.equal((await api('products/'+p.id)).stock,3);await api('transactions/'+d.id,'DELETE');
 const c2=await api('customers','POST',{name:'Hapus',phone:'081111111111'},201);await api('customers/'+c2.id,'DELETE');
 const p2=await api('products','POST',{name:'Teh',sku:'T01',costPrice:1,sellPrice:2,stock:1},201);await api('products/'+p2.id,'DELETE');
 await api('products','POST',{...p,sku:'NEG',stock:-1},400);
 assert.equal((await fetch(base+'/backend/database/transforma.db')).status,404);assert.equal((await fetch(base+'/.git/config')).status,404);assert.equal((await fetch(base+'/')).status,200);
 }finally{await new Promise(r=>s.close(r));}
});
