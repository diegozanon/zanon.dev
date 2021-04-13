import './theme-switcher';
import { configureFeedback } from './feedback';
import { configureNewsletter } from './newsletter';
import { hideTooltips } from './tooltips';
import { configureSnippet } from './snippets';
import { configureSPA } from './spa';
import { configureReadVisit } from './visits';
import * as Prismjs from '../assets/prismjs/prism.min.js';

declare global {
    const Prism: typeof Prismjs;
}

const page = window.location.pathname;

const isSnippet = page.startsWith('/snippet/');
if (isSnippet) {
    configureSnippet();
}

const isNewsletter = page === '/newsletter';
if (isNewsletter) {
    configureNewsletter();
}

// Add the service worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // navigator.serviceWorker.register('/service-worker.min.js');
    });
}

// hide tooltips from svg images (<title> is for accessibility and should not be seen by everyone)
hideTooltips();

configureFeedback();
configureReadVisit();
configureSPA();