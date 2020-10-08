import { minify } from 'html-minifier';

export const minifyHtml = (html: string): string => {
    return minify(html, {
        collapseWhitespace: true,
        conservativeCollapse: true,
        removeComments: true
    });
}