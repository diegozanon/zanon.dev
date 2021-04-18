import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';
import * as sharp from 'sharp';

export const transformHtml = async (html: string, isAmp = false): Promise<string> => {
    const $ = cheerio.load(html, null, false);

    $('a').each(function () {
        const elm = $(this);
        elm.attr('target', '_blank'); // always open links in a new window

        if (elm.attr('href').includes('http')) { // not a local link
            elm.attr('rel', 'noopener noreferrer');
        }
    });

    $('h2').each(function () {
        const elm = $(this);
        elm.replaceWith(`<h2 id="${elm.attr('id')}" tabindex="0">${elm.text()}</h2>`);
    });

    const elms = [];
    $('img').each(function () {
        const elm = $(this);
        elms.push(elm);

        if (!elm.attr('alt'))
            throw new Error(`There is one image without alt text: ${elm.attr('src')}`);
    });

    for (const elm of elms) {
        const src = elm.attr('src');
        const srcPath = path.resolve(path.join('./site', src));

        const filename = path.basename(srcPath);
        const filenameParsed = path.parse(filename);
        const filenameMobile = `${filenameParsed.name}-small${filenameParsed.ext}`;

        const files = await fs.promises.readdir(path.dirname(srcPath));
        const file = files.find(file => file === filenameMobile);

        if (!file)
            throw new Error(`Could not find small version of the image ${src}`);

        const srcMobile = path.join(src.split('/').slice(0, -1).join('/'), file);
        const srcMobilePath = path.resolve(path.join('./site', srcMobile));

        const metadata = await sharp(srcPath).metadata();
        const metadataMobile = await sharp(srcMobilePath).metadata();
        const [width, height] = [metadata.width, metadata.height];
        const [widthMobile, heightMobile] = [metadataMobile.width, metadataMobile.height];

        if (isAmp) {
            elm.replaceWith(`<img src="${src}" width="${width}" height="${height}" srcset="${src} ${width}w, ${srcMobile} ${widthMobile}w">`);
        } else {
            elm.replaceWith(`
                <picture>
                    <source srcset="${srcMobile}" media="(max-width: 480px)" width="${widthMobile}" height="${heightMobile}">
                    <source srcset="${src}" media="(min-width: 481px)" width="${width}" height="${height}">
                    <img src="${src}" width="${width}" height="${height}">
                </picture>
            `);
        }
    }

    const transformed = $.html();
    return `<div itemprop="articleBody">${transformed}</div>`;
}