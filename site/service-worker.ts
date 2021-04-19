const CACHE_VERSION = 'zanon.dev-v1';
const CACHE_FILES = [
    '/',
    '/me',
    '/privacy',
    '/newsletter',
    '/fonts/Roboto-Regular.woff2',
    '/bundle.min.css',
    '/bundle.min.mjs',
    '/site.json',
    '/posts.json',
    '/assets/prismjs/prism.min.css',
    '/assets/prismjs/prism.min.js'
];

self.addEventListener('install', (event: ExtendableEvent) => {
    event.waitUntil(
        caches.open(CACHE_VERSION)
            .then(cache => {
                return cache.addAll(CACHE_FILES);
            })
    );
});

self.addEventListener('activate', (event: ExtendableEvent) => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(keys.map((key, i) => {
                if (key !== CACHE_VERSION) {
                    return caches.delete(keys[i]);
                }
            }))
        })
    )
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(res => {
            if (res) {
                return res;
            }

            return fetch(event.request).then(res => {

                if (!res || res.status !== 200) {
                    return res;
                }

                const response = res.clone();

                caches.open(CACHE_VERSION).then(cache => {
                    cache.put(event.request, response);
                });

                return res;
            })
        })
    )
});

self.addEventListener('message', event => {
    if (event.data.action === 'skipWaiting') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (self as any).skipWaiting();
    }
});