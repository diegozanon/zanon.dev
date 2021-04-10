import { PostMeta } from "./types";

const formatDate = (date: string): string => {
    return new Date(`${date}T00:00:00`).toLocaleString('en-US', { month: 'long', day: '2-digit', year: 'numeric' });
}

export const generatePostHeader = (header: PostMeta): string => {
    const updatedOn = header.updatedOn ?
        'Updated on ' + formatDate(header.updatedOn) + ' - Originally published on '
        : '';

    const creationDate = formatDate(header.creationDate);

    const date = updatedOn + creationDate;

    return `
        <h1>${header.title}</h1>
        <div class="post-date">
            ${date}
        </div>
    `;
}