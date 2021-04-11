import { PostMeta } from "./types";

const formatDate = (date: string): string => {
    return new Date(`${date}T00:00:00`).toLocaleString('en-US', { month: 'long', day: '2-digit', year: 'numeric' });
}

export const generatePostHeader = (header: PostMeta): string => {
    const updatedOn = header.updatedOn ?
        'Updated on ' + formatDate(header.updatedOn) + ' - Originally published on '
        : '';

    return `
        <h1>${header.title}</h1>
        <div class="post-date">
            ${updatedOn}<time datetime="${header.creationDate}">${formatDate(header.creationDate)}</time>
        </div>
    `;
}