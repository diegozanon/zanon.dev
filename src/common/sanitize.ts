import * as sanitizeHtml from 'sanitize-html';

export const sanitize = (html: string): string => {
    return sanitizeHtml(html, {
        allowedTags: false, // allow all
        allowedAttributes: false, // allow all
        transformTags: {
            "a": (tagName: string, attribs: sanitizeHtml.Attributes): sanitizeHtml.Tag => {

                attribs.target = '_blank'; // always open links in a new window

                if (attribs.href.includes('http')) { // not a local link
                    attribs.rel = 'noopener noreferrer';
                }

                return { tagName, attribs };
            },
            "img": (tagName: string, attribs: sanitizeHtml.Attributes): sanitizeHtml.Tag => {

                if (!attribs.alt)
                    throw new Error(`There is one image without alt text: ${attribs.src}`);

                return { tagName, attribs };
            }
        }
    });
}