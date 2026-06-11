/* NENERGY 盘账 — Service Worker v1 */
var CACHE = 'nenergy-v1';
var FILES = [
  './cash-counter.html',
  './manifest.json'
];

/* 安装：预缓存所有文件 */
self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(c){ return c.addAll(FILES); })
  );
  self.skipWaiting();
});

/* 激活：清理旧版缓存 */
self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(k){ return k !== CACHE; })
            .map(function(k){ return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

/* 请求拦截：优先缓存，网络失败时用缓存兜底 */
self.addEventListener('fetch', function(e){
  e.respondWith(
    caches.match(e.request).then(function(cached){
      if(cached) return cached;
      return fetch(e.request).then(function(resp){
        /* 动态缓存同源请求 */
        if(resp && resp.status === 200 && e.request.url.startsWith(self.location.origin)){
          var clone = resp.clone();
          caches.open(CACHE).then(function(c){ c.put(e.request, clone); });
        }
        return resp;
      });
    }).catch(function(){
      return caches.match('./cash-counter.html');
    })
  );
});
