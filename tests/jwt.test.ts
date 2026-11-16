import test from 'node:test';
import assert from 'node:assert/strict';
import { login, register, getProfile, logout, clearAccess, getAccessToken, refreshAccess } from '../src/api.ts';
const user={id:1,username:'test',profile:{first_name:'',specialization:'guitar',specialization_display:'Гитара',bio:'',fee:'0.00'}};
test('login and registration use JWT backend and cookie credentials',async(t)=>{
 clearAccess();
 t.mock.method(globalThis,'fetch',async(url:unknown,init?:RequestInit)=>{
 assert.ok(String(url).startsWith('https://inai-col3.fishrungames.com/api/'));
 assert.equal(init?.credentials,'include'); assert.equal(init?.method,'POST');
 return Response.json({access:'old',user});
 });
 assert.deepEqual(await register({username:'test',password:'secret123'}),user);
 await login({username:'test',password:'secret123'}); assert.equal(getAccessToken(),'old');
});
test('401 triggers cookie refresh and one bearer retry',async(t)=>{
 let count=0;
 t.mock.method(globalThis,'fetch',async(url:unknown,init?:RequestInit)=>{
 count++;
 if(String(url).includes('refresh')){assert.equal(init?.body,undefined);return Response.json({access:'fresh'});}
 if(new Headers(init?.headers).get('Authorization')==='Bearer old')return Response.json({},{status:401});
 assert.equal(new Headers(init?.headers).get('Authorization'),'Bearer fresh');return Response.json(user);
 });
 assert.deepEqual(await getProfile(),user);assert.equal(count,3);
});
test('concurrent refresh is shared; failed refresh clears token',async(t)=>{
 let count=0;
 t.mock.method(globalThis,'fetch',async()=>{count++;return Response.json({access:'shared'});});
 await Promise.all([refreshAccess(),refreshAccess()]);assert.equal(count,1);
 t.mock.restoreAll();t.mock.method(globalThis,'fetch',async()=>Response.json({detail:'Expired'},{status:401}));
 await assert.rejects(refreshAccess());assert.equal(getAccessToken(),null);
});
test('logout reports server error and clears access',async(t)=>{
 t.mock.method(globalThis,'fetch',async()=>Response.json({detail:'Сбой выхода'},{status:500}));
 await assert.rejects(logout(),/Сбой выхода/);assert.equal(getAccessToken(),null);
});
test('missing access and repeated unauthorized response cannot loop',async(t)=>{
 clearAccess();t.mock.method(globalThis,'fetch',async()=>Response.json({user}));
 await assert.rejects(login({username:'test',password:'secret123'}),/access/);
 t.mock.restoreAll();let count=0;
 t.mock.method(globalThis,'fetch',async(url:unknown)=>{count++;return String(url).includes('refresh')?Response.json({access:'x'}):Response.json({},{status:401});});
 await assert.rejects(getProfile());assert.equal(count,4);assert.equal(getAccessToken(),null);
});

