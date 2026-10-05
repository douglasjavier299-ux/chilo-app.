'use strict';
const PREFIX='chilo-access-'+encodeURIComponent(self.registration.scope)+'-',CACHE=PREFIX+'v3';
const ASSETS=['./','./index.html','./styles.css','./app.js','./config.js','./manifest.webmanifest','./icons/apple-touch-icon.png','./icons/favicon.png','./icons/icon-192.png','./icons/icon-512.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith(PREFIX)&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  // Solo guarda recursos del acceso. Las respuestas de Google y los datos de ventas quedan fuera.
  if(event.request.method!=='GET'||url.origin!==self.location.origin||!url.href.startsWith(self.registration.scope))return;
  event.respondWith(fetch(event.request).then(response=>{if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(event.request,copy)));}return response;}).catch(async()=>{const cache=await caches.open(CACHE),cached=await cache.match(event.request);if(cached)return cached;if(event.request.mode==='navigate')return cache.match('./index.html');return Response.error();}));
});
