import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

registerRoute(
    ({ request }) => ['script', 'document'].includes(request.destination),
    new NetworkFirst()
);

registerRoute(
    ({ request }) => ['style', 'font', 'object'].includes(request.destination),
    new StaleWhileRevalidate()
);

registerRoute(
    ({ request }) => request.destination === 'image',
    new CacheFirst({
        cacheName: 'images-cache',
        plugins: [
            new ExpirationPlugin({
                maxEntries: 20, // Only cache 20 requests
                maxAgeSeconds: 7 * 24 * 60 * 60 // Cache for a maximum of a week
            })
        ]
    })
);