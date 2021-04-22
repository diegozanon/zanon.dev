import { PostMeta } from "./types";

const formatDate = (date: string, isShort: boolean): string => {
    return new Date(`${date}T00:00:00`).toLocaleString('en-US', { month: isShort ? 'short' : 'long', day: '2-digit', year: 'numeric' });
}

export const generatePostHeader = (header: PostMeta): string => {
    const isShort = header.updatedOn != null;
    const updatedOn = header.updatedOn ? `(updated on ${formatDate(header.updatedOn, isShort)})` : '';
    const metaUpdatedOn = header.updatedOn ? `<meta itemprop="dateModified" content="${header.updatedOn}">` : '';

    return `
        <h1 itemprop="name headline">${header.title}</h1>
        <meta itemprop="author" content="Diego Zanon">
        <div class="post-date">
            <time datetime="${header.creationDate}" itemprop="datePublished">${formatDate(header.creationDate, isShort)}</time>
            ${updatedOn} - <a target="_blank" rel="noopener noreferrer" href="${header.youtube}">video version</a>
            ${metaUpdatedOn}
        </div>
    `;
}