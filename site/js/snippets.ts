import { configureFeedback } from './feedback';
import { configureSPA } from './spa';

export const loadSnippet = (): void => {

    const notFoundElm = document.getElementById('not-found');
    const from404page = notFoundElm != null; // if not from404, then it is from SPA back-button

    if (from404page) {
        notFoundElm.style.display = 'none';
    }

    const code = window.location.pathname.replace('/snippet/', '');
    const url = `https://s3.amazonaws.com/code.zanon.dev/snippets/${code}`;

    fetch(url)
        .then(res => {

            if (!res || res.status !== 200) {
                throw null;
            }

            return res.text();
        })
        .then(text => {

            if (from404page) {
                document.getElementById('snippet').innerHTML = text;
            } else {
                document.getElementsByTagName('main')[0].innerHTML = text;
                configureSPA();
            }

            Prism.highlightAll();
            configureFeedback();
        })
        .catch(() => {
            if (from404page) {
                notFoundElm.style.display = '';
            }
        });
}