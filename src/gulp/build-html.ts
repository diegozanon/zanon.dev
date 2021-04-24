import * as cheerio from 'cheerio';
import * as fse from 'fs-extra';
import * as gulp from 'gulp';
import * as imagemin from 'gulp-imagemin';
import * as replace from 'gulp-replace';
import * as moment from 'moment';
import * as path from 'path';
import { isDir } from '../common/fs-utils';
import { Metatag, Metatags, PostsJson } from '../common/types';

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

const buildMetatagsObj = (input: Metatag): Metatags => {
    const domain = 'https://zanon.dev'
    const url = `${domain}${input.url}`;
    const image = `${domain}${input.image}`;
    return {
        twitterLabel: {
            title: 'twitter:title',
            url: 'twitter:url',
            description: 'twitter:description',
            image: 'twitter:image',
            imageAlt: 'twitter:image:alt'
        },
        twitterValue: {
            title: input.title,
            url: url,
            description: input.description,
            image: image,
            imageAlt: input.imageAlt
        },
        ogLabel: {
            type: 'og:type',
            title: 'og:title',
            url: 'og:url',
            description: 'og:description',
            image: 'og:image',
            imageAlt: 'og:imagem:alt'
        },
        ogValue: {
            type: input.type,
            title: input.title,
            url: url,
            description: input.description,
            image: image,
            imageAlt: input.imageAlt
        }
    } as Metatags;
}

const getMetatags = async (file: string): Promise<Metatags> => {
    const filename = file.split('/').pop();

    const web = 'website';
    const article = 'article';
    const defaultImage = '/icons/zanon-icon.png';
    const defaultImageAlt = 'The letter Z as the icon for the blog';

    switch (filename) {
        case '404':
            return buildMetatagsObj({
                type: web,
                title: 'Page not Found',
                url: '/404',
                description: "Oops, can't find this page",
                image: defaultImage,
                imageAlt: defaultImageAlt
            });
        case 'me':
            return buildMetatagsObj({
                type: web,
                title: 'About me',
                url: '/me',
                description: "I'm a Full-Stack Developer, JavaScripter and AWS power-user",
                image: '/imgs/site/me/me.jpeg',
                imageAlt: "The site's owner photo"
            });
        case 'newsletter':
            return buildMetatagsObj({
                type: web,
                title: 'Newsletter',
                url: '/newsletter',
                description: 'Subscribe to receive monthly updates',
                image: defaultImage,
                imageAlt: defaultImageAlt
            });
        case 'privacy':
            return buildMetatagsObj({
                type: web,
                title: 'Privacy Statement',
                url: '/privacy',
                description: 'This website respects your privacy',
                image: defaultImage,
                imageAlt: defaultImageAlt
            });
        default:
            const postsJson = (JSON.parse(await fse.promises.readFile(`./site/dist/posts.json`, 'utf8')) as PostsJson).posts;
            const post = postsJson.find(post => post.header.slug === filename);
            return buildMetatagsObj({
                type: article,
                title: post.header.title,
                url: `/${post.header.slug}`,
                description: post.header.shortDescription,
                image: post.header.thumbnail,
                imageAlt: post.header.thumbnailAltTxt
            });
    }
}

const copyImages = async (): Promise<void> => {
    await new Promise(async resolve => {
        gulp.src('site/imgs/**')
            .pipe(imagemin({ silent: true }))
            .pipe(gulp.dest('site/dist/imgs'))
            .on('end', resolve);
    });

    // check if there are small images for every normal image  
    const getFiles = async (dir): Promise<string[]> => {
        const files = [];
        const dirents = await fse.promises.readdir(dir, { withFileTypes: true });
        for (const dirent of dirents) {
            const res = path.resolve(dir, dirent.name);
            if (dirent.isDirectory()) {
                const innerFiles = await getFiles(res);
                files.push(...innerFiles);
            }
            else {
                files.push(res);
            }
        }

        return Array.prototype.concat(...files);
    }

    const dir = path.resolve('./site/imgs/posts');
    const files = (await getFiles(dir)).filter(file => !file.includes('.DS_Store'));

    let countOriginal = 0;
    let countSmall = 0;
    for (const file of files) {
        if (file.includes('-small.'))
            countSmall++;
        else
            countOriginal++;
    }

    if (countSmall != countOriginal) {
        // If the number is different, it means that I forgot to run the scale-img script for one of them
        throw new Error(`The number of small images (${countSmall}) is different from the number of the original images (${countOriginal}).`);
    }
}

export const copyToDist = async (done): Promise<void> => {
    await fse.copy('site/assets', 'site/dist/assets');
    await fse.copy('site/demos', 'site/dist/demos');
    await fse.copy('site/fonts', 'site/dist/fonts');
    await fse.copy('site/icons', 'site/dist/icons');
    await copyImages();
    await fse.copy('site/browserconfig.xml', 'site/dist/browserconfig.xml');
    await fse.copy('site/favicon.ico', 'site/dist/favicon.ico');
    await fse.copy('site/manifest.json', 'site/dist/manifest.json');
    await fse.copy('site/robots.txt', 'site/dist/robots.txt');

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

export const prepareMetatags = async (done): Promise<void> => {

    let files = await getHtmlFiles();
    files = files.filter(file => !file.endsWith('index.html'));

    for (const file of files) {
        const html = await fse.promises.readFile(file, 'utf8');
        const $ = cheerio.load(html);
        const meta = await getMetatags(file);

        $(`meta[name="${meta.twitterLabel.title}"]`).attr('content', meta.twitterValue.title);
        $(`meta[name="${meta.twitterLabel.url}"]`).attr('content', meta.twitterValue.url);
        $(`meta[name="${meta.twitterLabel.description}"]`).attr('content', meta.twitterValue.description);
        $(`meta[name="${meta.twitterLabel.image}"]`).attr('content', meta.twitterValue.image);
        $(`meta[name="${meta.twitterLabel.imageAlt}"]`).attr('content', meta.twitterValue.imageAlt);
        $(`meta[property="${meta.ogLabel.type}"]`).attr('content', meta.ogValue.type);
        $(`meta[property="${meta.ogLabel.title}"]`).attr('content', meta.ogValue.title);
        $(`meta[property="${meta.ogLabel.url}"]`).attr('content', meta.ogValue.url);
        $(`meta[property="${meta.ogLabel.description}"]`).attr('content', meta.ogValue.description);
        $(`meta[property="${meta.ogLabel.image}"]`).attr('content', meta.ogValue.image);
        $(`meta[property="${meta.ogLabel.imageAlt}"]`).attr('content', meta.ogValue.imageAlt);

        await fse.promises.writeFile(file, $.html());
    }

    done();
}