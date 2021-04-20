import { renderFullPages } from './render-full-pages';
import { updateJsons } from './update-jsons';
import { updateRss, updateSitemap } from './update-xmls';

export const buildPosts = async (output: string): Promise<void> => {
    await updateJsons(false, output);
    await updateRss();
    await updateSitemap();
    await renderFullPages(output);
}