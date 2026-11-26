const CACHE='exercise-journal-shell-v1.9';
const ROOT=new URL('./',self.location.href);
const SHELL=['index.html','manifest.json','icon-192.png','icon-512.png','apple-touch-icon.png'].map(x=>new URL(x,ROOT).href);
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL))));
self.addEventListener('activate',e=>e.waitUntil((async()=>{for(const k of await caches.keys())if(k.startsWith('exercise-journal-shell-')&&k!==CACHE)await caches.delete(k);await self.clients.claim()})()));
self.addEventListener('message',e=>{if(e.data?.type==='SKIP_WAITING')self.skipWaiting()});
self.addEventListener('fetch',e=>{const r=e.request,u=new URL(r.url);if(r.method!=='GET')return;
// Never cache authentication requests, Firestore responses or personal records.
if(r.mode==='navigate'&&u.origin===ROOT.origin&&u.pathname.startsWith(ROOT.pathname)){e.respondWith((async()=>{const c=await caches.open(CACHE);return await c.match(SHELL[0])||fetch(r)})());return}
if(SHELL.includes(u.href)){e.respondWith(caches.match(r).then(v=>v||fetch(r)));return}
// Only immutable, versioned Firebase SDK modules and public exercise illustrations.
if((u.origin==='https://www.gstatic.com'&&u.pathname.startsWith('/firebasejs/10.14.1/'))||(u.origin==='https://raw.githubusercontent.com'&&u.pathname.startsWith('/yuhonas/free-exercise-db/main/exercises/')&&r.destination==='image')||(u.origin==='https://exercise-dataset.com'&&u.pathname.startsWith('/images/flat/')&&r.destination==='image')){e.respondWith((async()=>{const c=await caches.open(CACHE),hit=await c.match(r);if(hit)return hit;const response=await fetch(r);if(response.ok||response.type==='opaque')await c.put(r,response.clone());return response})())}
});
