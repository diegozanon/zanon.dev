import { minify } from 'html-minifier-terser';

export const minifyHtml = (html: string): string => {
    return minify(html, {
        collapseWhitespace: true,
        conservativeCollapse: true,
        removeComments: true
    });
}