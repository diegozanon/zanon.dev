import * as cors from 'cors';
import * as connect from 'gulp-connect';
import * as path from 'path';

export const serve = (done): void => {
    connect.server({
        root: 'site/dist',
        livereload: true,
        port: 8080,
        fallback: path.resolve('./site/dist/404'),
        middleware: () => {
            return [cors(), (req, res, next): void => {

                // if doesn't have an extension, treat as html
                if (req.url !== '/' && req.url.split('.').length === 1) {
                    res.setHeader('Content-Type', 'text/html')
                }

                next();
            }];
        }
    });

    done();
}