import * as fse from 'fs-extra';
import * as gulp from 'gulp';
import * as replace from 'gulp-replace';
import * as moment from 'moment';
import * as path from 'path';
import { isDir } from '../common/fs-utils';

const getHtmlFiles = async (): Promise<string[]> => {
    const res = new Array<string>();
    const dir = './site/dist';
    const files = await fse.readdir(dir);
    for (const filename of files) {

        const file = path.join(dir, filename);

        if (await isDir(file) || filename === 'feed') {
            continue;
        }

        const ext = path.extname(file);
        if (!ext || ext === '.html') {
            res.push(file);
        }
    }

    return res;
}

export const copyToDist = async (done): Promise<void> => {
    await fse.copy('site/fonts', 'site/dist/fonts');
    await fse.copy('site/icons', 'site/dist/icons');
    await fse.copy('site/imgs', 'site/dist/imgs');
    await fse.copy('site/browserconfig.xml', 'site/dist/browserconfig.xml');
    await fse.copy('site/favicon.ico', 'site/dist/favicon.ico');
    await fse.copy('site/manifest.json', 'site/dist/manifest.json');
    await fse.copy('site/robots.txt', 'site/dist/robots.txt');
    await fse.copy('site/assets/prismjs/prism.min.css', 'site/dist/assets/prismjs/prism.min.css');
    await fse.copy('site/assets/prismjs/prism.min.js', 'site/dist/assets/prismjs/prism.min.js');
    await fse.copy('site/assets/resume.pdf', 'site/dist/assets/resume.pdf');

    done();
}

export const avoidCache = async (done): Promise<void> => {
    const date = moment().format('YYYYMMDDHHmmss');
    await new Promise(async resolve => {
        gulp.src(await getHtmlFiles())
            .pipe(replace('/bundle.min.mjs', `/bundle.min.mjs?v=${date}`))
            .pipe(replace('/site.json', `/site.json?v=${date}`))
            .pipe(replace('/posts.json', `/posts.json?v=${date}`))
            .pipe(replace('/bundle.min.css', `/bundle.min.css?v=${date}`))
            .pipe(gulp.dest('./site/dist/'))
            .on('end', resolve);
    });

    done();
}