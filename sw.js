/**
 * Service Worker para Suporte Offline e Cache Rápido
 * Meu Carrossel - Secretaria Municipal de Educação de Batatais
 */

const CACHE_NAME = 'sme-carrossel-v2';
const STATIC_ASSETS = [
    './',
    './index.html',
    './style.css',
    './script.js',
    './news.json'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS).catch((err) => {
                console.warn('Falha parcial ao pré-carregar cache estático:', err);
            });
        }).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Estratégia Stale-While-Revalidate para o arquivo news.json
    if (url.pathname.endsWith('news.json')) {
        event.respondWith(
            caches.open(CACHE_NAME).then(async (cache) => {
                const cachedResponse = await cache.match(request);
                const fetchPromise = fetch(request).then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        cache.put(request, networkResponse.clone());
                    }
                    return networkResponse;
                }).catch(() => cachedResponse);

                return cachedResponse || fetchPromise;
            })
        );
        return;
    }

    // Cache First com Network Fallback para imagens
    if (request.destination === 'image' || url.pathname.match(/\.(jpeg|jpg|png|webp|svg)$/i)) {
        event.respondWith(
            caches.match(request).then((cachedImage) => {
                if (cachedImage) return cachedImage;
                return fetch(request).then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const responseClone = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
                    }
                    return networkResponse;
                }).catch(() => {
                    // Fallback se estiver completamente offline
                    return new Response('', { status: 404, statusText: 'Offline image unavailable' });
                });
            })
        );
        return;
    }

    // Network First para demais requisições com Cache Fallback
    event.respondWith(
        fetch(request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
                const responseClone = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
            }
            return networkResponse;
        }).catch(() => caches.match(request))
    );
});

