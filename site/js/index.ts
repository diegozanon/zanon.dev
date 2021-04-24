import './theme-switcher';
import { configureDemoButton, loadDemo } from './demo';
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
const isDemo = page.startsWith('/demo/');
const isNewsletter = page === '/newsletter';
if (isSnippet) {
    loadSnippet();
} else if (isDemo) {
    loadDemo();
} else if (isNewsletter) {
    configureNewsletter();
}

configureReadVisit();
configureDemoButton();
configureFeedback();
configureSPA();
hideTooltips();

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