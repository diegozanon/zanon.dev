import { moveTo404 } from './not-found';
import { configureSPA } from './spa';
import { Demo, VisitType } from './types';
import { sendVisited } from './visits';

export const loadDemo = (inline?: boolean, slug?: string): void => {
    const name = inline ? slug : window.location.pathname.replace('/demo/', '');
    const url = `/demos/${name}/${name}.json`;

    fetch(url)
        .then(res => {

            if (!res || res.status !== 200) {
                throw null;
            }

            return res.json();
        })
        .then((demo: Demo): void => {

            const html = inline ? demo.html : `<h1>${demo.title}</h1>${demo.html}`;

            if (inline) {
                document.getElementById('play-demo').innerHTML = html;
            } else {
                document.getElementsByTagName('main')[0].innerHTML = html;
            }

            if (!inline) {
                document.title = `${demo.title} - Zanon.dev`;
            }

            if (demo.hasCSS) {
                const linkID = `${name}-link`;
                if (!document.getElementById(linkID)) {
                    const link = document.createElement('link');
                    link.id = linkID;
                    link.setAttribute('rel', 'stylesheet');
                    link.setAttribute('href', `/demos/${name}/bundle.min.css`);
                    document.head.appendChild(link);
                }
            }

            if (demo.hasJS) {
                const scriptID = `${name}-script`;
                const scriptElm = document.getElementById(scriptID);
                if (scriptElm) {
                    // if exists, remove
                    scriptElm.outerHTML = '';
                }

                const script = document.createElement('script');
                script.id = scriptID;
                script.src = `/demos/${name}/bundle.min.js`;
                document.head.appendChild(script);
            }

            configureSPA();
        })
        .catch(moveTo404);
}

export const configureDemoButton = (): void => {
    const button = document.querySelector('#play-demo input[type=button]') as HTMLInputElement;

    if (button) {
        button.onclick = (): void => {
            loadDemo(true, button.id);
            sendVisited(`/demo/${button.id}#button`, VisitType.Clicked);
        }
    }
}