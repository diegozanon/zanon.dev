import { configureFeedback } from './feedback';
import { moveTo404 } from './not-found';
import { configureSPA } from './spa';
import { hideTooltips } from './tooltips';

export const loadSnippet = (): void => {

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

            document.getElementsByTagName('main')[0].innerHTML = text;

            Prism.highlightAll();
            configureFeedback();
            configureSPA();
            hideTooltips();
        })
        .catch(moveTo404);
}