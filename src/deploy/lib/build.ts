import { renderFullPages } from '../../scripts/render-full-pages';
import { updateJsons } from '../../scripts/update-jsons';

export const buildPosts = async (output: string): Promise<void> => {
    await updateJsons(output);
    await renderFullPages(output);
}