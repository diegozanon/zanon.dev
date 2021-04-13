import { lambdaURL } from './config';
import storage from './storage';
import { BackendRequestType, FeedbackType, Votes } from './types';

const sendFeedback = async (action: FeedbackType, message?: string): Promise<void> => {
    let votes = JSON.parse(storage.get('votes')) as Votes;
    const page = window.location.pathname;
    const noVotesHere = !Object.keys(votes).find(_page => _page === page);
    const isMessage = action === FeedbackType.Message;
    if (!votes || noVotesHere || isMessage) {

        await fetch(lambdaURL, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ page, action, message, requestType: BackendRequestType.Feedback })
        }).then(response => {

            if (isMessage) {
                let message = '';
                if (response.status >= 400) {
                    message = "Oops! Something went wrong. I'm sorry.";
                } else {
                    message = 'Thanks for your feedback!';
                }

                const result = document.getElementById('feedback-result');
                result.innerHTML = message;
                result.classList.remove('dont-display');

                (document.querySelector('#feedback-message textarea') as HTMLTextAreaElement).value = '';
            }
        });
    }

    if (!isMessage) {
        votes = votes || {};
        votes[page] = action;

        storage.set('votes', JSON.stringify(votes));
    }
}

export const configureFeedback = (): void => {
    if (document.getElementById('feedback')) {
        const heart = document.querySelector('#feedback .heart') as HTMLElement;
        const brokenHeart = document.querySelector('#feedback .broken-heart') as HTMLElement;
        const bug = document.querySelector('#feedback .bug') as HTMLElement;
        const chat = document.querySelector('#feedback .chat') as HTMLElement;
        const messageBox = document.getElementById('feedback-message') as HTMLElement;
        const message = document.querySelector('#feedback-message textarea') as HTMLTextAreaElement;
        const sendMessage = document.querySelector('#feedback-message input[type=button]') as HTMLInputElement;
        const feedbackResult = document.getElementById('feedback-result') as HTMLElement;

        const votes = JSON.parse(storage.get('votes')) as Votes;
        if (votes) {
            const page = Object.keys(votes).find(page => page === window.location.pathname);

            if (votes[page] === FeedbackType.Like) {
                heart.classList.remove('gray-icon');
                brokenHeart.classList.add('gray-icon');
            } else if (votes[page] === FeedbackType.Dislike) {
                heart.classList.add('gray-icon');
                brokenHeart.classList.remove('gray-icon');
            }
        }

        heart.onclick = async (): Promise<void> => {
            heart.classList.remove('gray-icon');
            brokenHeart.classList.add('gray-icon');

            await sendFeedback(FeedbackType.Like);
        }

        brokenHeart.onclick = async (): Promise<void> => {
            heart.classList.add('gray-icon');
            brokenHeart.classList.remove('gray-icon');

            await sendFeedback(FeedbackType.Dislike);
        }

        bug.onclick = async (): Promise<void> => {
            bug.classList.remove('gray-icon');
            chat.classList.add('gray-icon');
            messageBox.classList.remove('dont-display');
            feedbackResult.classList.add('dont-display');
        }

        chat.onclick = async (): Promise<void> => {
            bug.classList.add('gray-icon');
            chat.classList.remove('gray-icon');
            messageBox.classList.remove('dont-display');
            feedbackResult.classList.add('dont-display');
        }

        sendMessage.onclick = async (): Promise<void> => {
            if (message.value.length <= 10) {
                feedbackResult.innerHTML = 'Minimum message size is 10.';
                feedbackResult.classList.remove('dont-display');
                return;
            }

            messageBox.classList.add('dont-display');
            feedbackResult.innerHTML = 'Sending...';
            feedbackResult.classList.remove('dont-display');

            await sendFeedback(FeedbackType.Message, message.value);
            bug.classList.add('gray-icon');
            chat.classList.add('gray-icon');
        }
    }
}