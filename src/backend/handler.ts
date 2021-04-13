import { APIGatewayProxyResult, APIGatewayProxyEvent } from 'aws-lambda';
import { successHandler, errorHandler } from '../common/http-response';
import { BackendRequestType, HttpResponseOptions } from '../common/types';
import { isBot } from './lib/bot';
import { insertFeedback, insertVisit, newsletter } from './lib/dynamodb';
import { notifyFeedback, notifyNewsletter } from './lib/ses';

const validateIsHttPost = (event: APIGatewayProxyEvent): void => {
    if (event.httpMethod !== 'POST')
        throw Error('This resource accepts only POST requests');
}

export const backend = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

    try {
        if (event.httpMethod === 'OPTIONS') {
            return successHandler({ message: 'success', cors: true, httpMethod: 'OPTIONS' });
        }

        const body = JSON.parse(event.body);

        if (process.env.IS_OFFLINE || !isBot(event.requestContext.identity.userAgent)) {
            switch (body.requestType) {
                case BackendRequestType.Feedback:
                    validateIsHttPost(event);
                    if (body.message) {
                        await notifyFeedback(body.page, body.message);
                    } else {
                        await insertFeedback(body.page, body.action);
                    }
                    break;
                case BackendRequestType.Visit:
                    validateIsHttPost(event);
                    await insertVisit(body.page, body.action);
                    break;
                case BackendRequestType.Newsletter:
                    await newsletter(event.httpMethod, body.email);
                    await notifyNewsletter(event.httpMethod);
                    break;
            }
        }

        const response = { message: 'success', cors: true } as HttpResponseOptions;
        return successHandler(response);
    } catch (err) {
        console.error(err);
        return errorHandler({ error: err, cors: true });
    }
}