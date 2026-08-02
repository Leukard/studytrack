const CACHE_NAME = 'studytrack-v2';

// "App shell": tudo que é necessário pra página abrir e aparecer corretamente,
// mesmo sem internet — HTML, JS próprio, ícones. CSS/fontes externas (Tailwind,
// Google Fonts) também entram, mas via cache "melhor esforço" (ver abaixo).
const ARQUIVOS_ESSENCIAIS = [
  'index.html',
  'dashboard.html',
  'sala-de-estudos.html',
  'js/tema.js',
  'js/api.js',
  'js/auth.js',
  'js/dashboard.js',
  'js/pomodoro.js',
  'js/pwa.js',
  'js/supabaseClient.js',
  'manifest.json',
  'icons/icon-192.png',
  'icons/icon-512.png',
];

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ARQUIVOS_ESSENCIAIS))
  );
  self.skipWaiting();
});

// Remove caches de versões antigas quando um novo Service Worker assume
self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys().then((nomes) =>
      Promise.all(nomes.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (evento) => {
  const url = new URL(evento.request.url);

  // Chamadas pra API (Render) nunca devem ser cacheadas — dados sempre
  // precisam ser reais e atuais; se falhar, deixa o erro acontecer
  // normalmente (o api.js já trata isso com try/catch nas telas)
  if (url.origin.includes('onrender.com')) {
    evento.respondWith(fetch(evento.request));
    return;
  }

  // Para tudo mais (HTML, JS, CSS externo, fontes, ícones): tenta a rede
  // primeiro (conteúdo sempre atualizado); se falhar (offline), busca no
  // cache — e se nem isso tiver, ainda tenta servir o cache como último recurso
  evento.respondWith(
    fetch(evento.request)
      .then((resposta) => {
        // Guarda uma cópia no cache sempre que conseguir buscar da rede,
        // mantendo o cache atualizado automaticamente com o uso normal
        const copia = resposta.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(evento.request, copia));
        return resposta;
      })
      .catch(() => caches.match(evento.request))
  );
});