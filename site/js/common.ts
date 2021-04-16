import { PostMeta } from "./types";

const formatDate = (date: string): string => {
    return new Date(`${date}T00:00:00`).toLocaleString('en-US', { month: 'long', day: '2-digit', year: 'numeric' });
}

export const generatePostHeader = (header: PostMeta): string => {
    const updatedOn = header.updatedOn ? `Updated on ${formatDate(header.updatedOn)} - Originally published on ` : '';
    const metaUpdatedOn = header.updatedOn ? `<meta itemprop="dateModified" content="${header.updatedOn}">` : '';

    return `
        <h1 itemprop="name headline">${header.title}</h1>
        <meta itemprop="author" content="Diego Zanon">
        <div class="post-date">
            ${updatedOn}<time datetime="${header.creationDate}" itemprop="datePublished">${formatDate(header.creationDate)}</time>${metaUpdatedOn}
        </div>
    `;
}