import { lambdaURL } from './config';
import storage from './storage';
import { BackendRequestType, Comment } from './types';

const getStorageComments = (): Comment[] => {
    return JSON.parse(storage.get('comments')) || [] as Comment[];
}

const setStorageComments = (comments: Comment[]): void => {
    storage.set('comments', JSON.stringify(comments));
}

const printTimestamp = (timestamp: string): string => {
    const datetime = new Date(timestamp);
    const date = datetime.toLocaleDateString('en-us', { month: 'short', day: 'numeric', year: 'numeric' });
    const time = datetime.toLocaleTimeString(navigator.language || 'en-us', { hour: '2-digit', minute: '2-digit' });
    return `${date} at ${time}`;
}

const addEditDeleteButtons = (guid: string): string => {
    return `
        <input type="button" class="edit-comment btn-secondary" name="edit-comment" data-guid="${guid}" value="Edit">
        <input type="button" class="delete-comment btn-danger" name="delete-comment" data-guid="${guid}" value="Delete">
    `;
}

const addComment = (comment: Comment): string => {

    let editDeleteButtons = '';
    if (comment.guid) {
        editDeleteButtons = addEditDeleteButtons(comment.guid);
    } else {
        // check if the comment is saved in local storage
        const savedComments = getStorageComments();
        for (const savedComment of savedComments) {
            if (comment.page === savedComment.page && comment.timestamp === savedComment.timestamp) {
                editDeleteButtons = addEditDeleteButtons(savedComment.guid);
            }
        }
    }

    return `
        <div id="comment">
            <div class="avatar">${comment.username.substring(0, 1)}</div>
            <div class="timestamp">${printTimestamp(comment.timestamp)}</div>
            <h3>${comment.username}</h3>
            ${comment.comment}
            ${editDeleteButtons}
        </div>
    `;
}

// https://stackoverflow.com/a/2117523/1476885
const uuidv4 = (): string => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return `${1e7}-${1e3}-${4e3}-${8e3}-${1e11}`.replace(/[018]/g, (c: any) =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
};

const newCommentClickEvent = async (page: string): Promise<void> => {
    const userElm = document.querySelector('#comment-widget .comment-username') as HTMLInputElement;
    const commentElm = document.querySelector('#comment-widget .comment-text') as HTMLTextAreaElement;
    const username = userElm.value;
    const comment = commentElm.value;
    userElm.value = '';
    commentElm.value = '';

    const guid = uuidv4();
    const localTimestamp = new Date().toString();
    const newComment = { page, username, comment, timestamp: localTimestamp, guid };
    const commentsElm = document.getElementById('comments');
    commentsElm.innerHTML += addComment(newComment);

    const rawResponse = await fetch(lambdaURL, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            page,
            username,
            comment,
            guid,
            requestType: BackendRequestType.Comment
        })
    });

    const serverTimestamp = (await rawResponse.json()).data.timestamp;

    newComment.timestamp = serverTimestamp;
    const savedComments = getStorageComments();
    savedComments.push(newComment);
    setStorageComments(savedComments);
}

const addDeleteCommentClickEvent = (page: string): void => {
    const deleteElms = document.getElementsByClassName('delete-comment') as HTMLCollectionOf<HTMLElement>;
    for (const deleteElm of deleteElms) {
        deleteElm.onclick = async (): Promise<void> => {

            const guid = deleteElm.dataset.guid;
            let savedComments = getStorageComments();
            const commentToDelete = savedComments.find((el: Comment) => { return el.guid === guid });

            const commentDiv = deleteElm.parentNode;
            commentDiv.parentNode.removeChild(commentDiv);

            const rawResponse = await fetch(lambdaURL, {
                method: 'DELETE',
                headers,
                body: JSON.stringify({
                    page,
                    username: commentToDelete.username,
                    comment: commentToDelete.comment,
                    guid,
                    requestType: BackendRequestType.Comment
                })
            });

            await rawResponse.json();

            savedComments = savedComments.filter((el: Comment) => { return el.guid !== guid });
            setStorageComments(savedComments);
        }
    }
}

const addEditCommentClickEvent = (page: string): void => {
    const editElms = document.getElementsByClassName('edit-comment') as HTMLCollectionOf<HTMLElement>;
    for (const editElm of editElms) {
        editElm.onclick = (): void => {

            const commentDiv = editElm.parentNode as HTMLElement;
            const commentBoxDiv = document.querySelector('#comment-widget');
            commentDiv.innerHTML = commentBoxDiv.outerHTML;

            const guid = editElm.dataset.guid;
            const savedComments = getStorageComments();
            const commentToEdit = savedComments.find((el: Comment) => { return el.guid === guid });

            const sendElm = commentDiv.querySelector('.send-comment') as HTMLInputElement;
            const userElm = commentDiv.querySelector('.comment-username') as HTMLInputElement;
            const commentElm = commentDiv.querySelector('.comment-text') as HTMLTextAreaElement;
            userElm.value = commentToEdit.username;
            commentElm.value = commentToEdit.comment;

            sendElm.onclick = async (): Promise<void> => {

                commentDiv.innerHTML = addComment({
                    page,
                    username: userElm.value,
                    comment: commentElm.value,
                    timestamp: commentToEdit.timestamp
                });

                const rawResponse = await fetch(lambdaURL, {
                    method: 'PUT',
                    headers,
                    body: JSON.stringify({
                        page,
                        username: userElm.value,
                        comment: commentElm.value,
                        guid,
                        requestType: BackendRequestType.Comment
                    })
                });

                await rawResponse.json();

                commentToEdit.username = userElm.value;
                commentToEdit.comment = commentElm.value;
                setStorageComments(savedComments);

                addEditCommentClickEvent(page);
                addDeleteCommentClickEvent(page);
            }
        }
    }
}

export const fillComments = async (page: string): Promise<void> => {

    const url = `${lambdaURL}?requestType=${BackendRequestType.Comment}&page=${page.substring(1)}`;
    const rawResponse = await fetch(url);
    const comments = ((await rawResponse.json()).data as Comment[]).sort((c1, c2) => {
        return new Date(c2.timestamp).getTime() - new Date(c1.timestamp).getTime()
    });

    let commentsHtml = '';
    for (const comment of comments) {
        comment.page = page;
        commentsHtml += addComment(comment);
    }

    const commentsElm = document.getElementById('comments');
    commentsElm.innerHTML = commentsHtml;

    (document.querySelector('#comment-widget .send-comment') as HTMLInputElement).onclick = async (): Promise<void> => {
        await newCommentClickEvent(page);
        addEditCommentClickEvent(page);
        addDeleteCommentClickEvent(page);
    }

    addEditCommentClickEvent(page);
    addDeleteCommentClickEvent(page);
}