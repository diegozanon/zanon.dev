import * as cors from 'cors';
import * as connect from 'gulp-connect';

export const serve = (done): void => {
    connect.server({
        root: 'site/dist',
        livereload: true,
        port: 8080,
        middleware: () => {
            return [cors(), (req, res, next): void => {

                // if doesn't have an extension or is amphtml, treat as html
                if ((req.url !== '/' && req.url.split('.').length === 1) || req.url.endsWith('.amphtml')) {
                    res.setHeader('Content-Type', 'text/html')
                }

                next();
            }];
        }
    });

    done();
}