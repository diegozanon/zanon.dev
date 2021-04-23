import { moveTo404 } from './notFound';
import { configureSPA } from './spa';
import { Demo } from './types';

export const loadDemo = (): void => {
    const demo = window.location.pathname.replace('/demo/', '');
    const url = `/demos/${demo}/${demo}.json`;

    fetch(url)
        .then(res => {

            if (!res || res.status !== 200) {
                throw null;
            }

            return res.json();
        })
        .then((json: Demo): void => {

            const html = `<h1>${json.title}</h1>${json.html}`;
            document.getElementsByTagName('main')[0].innerHTML = html;

            configureSPA();
        })
        .catch(moveTo404);
}