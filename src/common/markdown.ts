import * as marked from 'marked';
import * as Prism from 'prismjs';

const mark = (html: string, ampify = false): string => {
    const renderer = new marked.Renderer();

    renderer.image = (href: string, title: string, text: string): string => {

        if (!text) {
            throw new Error(`There is one image without alt text: ${href}`);
        }

        if (!title || title.split(',').length != 4) {
            // Valid example: ![alt text](/imgs/foo.png "350,350,100,100")
            // where the first 2 numbers are the width/height dimensions for the main image 
            // and the last 2 are the width/height dimensions for the small image
            throw new Error(`Image ${href} has invalid dimensions properties`);
        }

        const [width, height, smallWidth, smallHeight] = title.split(',').map(t => t.trim());
        const imageExtension = href.split('.').pop();
        const hrefMobile = href.replace(`.${imageExtension}`, `-small.${imageExtension}`);

        if (ampify) {
            return `<img src="${href}" alt="${text}" width="${width}" height="${height}" srcset="${href} ${width}w, ${hrefMobile} ${smallWidth}w">`;
        } else {
            return `
                <picture>
                    <source srcset="${hrefMobile}" media="(max-width: 480px)" width="${smallWidth}" height="${smallHeight}">
                    <source srcset="${href}" media="(min-width: 481px)" width="${width}" height="${height}">
                    <img src="${href}" alt="${text}" width="${width}" height="${height}">
                </picture>
            `;
        }
    }

    renderer.link = (href: string, title: string, text: string): string => {

        if (href.startsWith('/demo/') && text == 'play') {
            return `
                <div id="play-demo">
                    <input id="${href.replace('/demo/', '')}" type="button" name="play" value="Play Demo">
                </div>`;
        }

        if (href.includes('http')) {
            // Not a local link. Always open external links in a new window with noopener noreferrer
            return `<a target="_blank" rel="noopener noreferrer" href="${href}">${text}</a>`;
        } else {
            return `<a href="${href}">${text}</a>`;
        }
    }

    renderer.heading = (text: string, level: number, raw: string, slugger: marked.Slugger): string => {
        const id = slugger.slug(text);
        if (level === 2) {
            return `
                <h2 id="${id}" tabindex="0">
                    <a class="anchor" href="#${id}">
                        <img src="/imgs/site/anchor.svg" alt="an anchor to link to this specific section" width="24" height="24" />
                    </a>
                    ${text}
                </h2>`;
        } else {
            return `<h${level} id="${id}">${text}</h${level}>`;
        }
    }

    marked.use({
        renderer
    });

    if (ampify) {
        marked.setOptions({
            highlight: (code, lang) => {
                if (Prism.languages[lang]) {
                    return Prism.highlight(code, Prism.languages[lang], lang);
                } else {
                    return code;
                }
            }
        });
    }

    return marked(html);
}

export const markArticle = (html: string, ampify = false): string => {
    return `<div itemprop="articleBody">${mark(html, ampify)}</div>`;
};