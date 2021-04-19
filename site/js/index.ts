import './theme-switcher';
import { configureAnchors } from './anchor';
import { configureFeedback } from './feedback';
import { configureNewsletter } from './newsletter';
import { hideTooltips } from './tooltips';
import { loadSnippet } from './snippets';
import { configureSPA } from './spa';
import storage from './storage';
import { configureReadVisit } from './visits';
import * as Prismjs from '../assets/prismjs/prism.min.js';

declare global {
    const Prism: typeof Prismjs;
}

const page = window.location.pathname;

const isSnippet = page.startsWith('/snippet/');
if (isSnippet) {
    loadSnippet();
}

const isNewsletter = page === '/newsletter';
if (isNewsletter) {
    configureNewsletter();
}

// Add the service worker
if ('serviceWorker' in navigator && !storage.get('no-service-worker')) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.min.js')
            .then(registration => {

                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;

                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed') {
                            newWorker.postMessage({ action: 'skipWaiting' });
                        }
                    });
                });
            });

        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (refreshing) return;
            refreshing = true;
            window.location.reload();
        });
    });
}

configureFeedback();
configureReadVisit();
configureSPA();
configureAnchors();

// hide tooltips from svg images (<title> is for accessibility and should not be seen by everyone)
hideTooltips();