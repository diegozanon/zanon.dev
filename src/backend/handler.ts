import { APIGatewayProxyResult, APIGatewayProxyEvent } from 'aws-lambda';
import { successHandler, errorHandler } from '../common/http-response';
import { BackendRequestType, HttpResponseOptions } from '../common/types';
import { isBot } from './lib/bot';
import { getComments, insertFeedback, insertVisit, newComment } from './lib/dynamodb';
import { notifyComment } from './lib/ses';

const validateIsPost = (event: APIGatewayProxyEvent): void => {
    if (event.httpMethod !== 'POST')
        throw Error('This resource accepts only POST requests');
}

export const backend = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

    try {
        if (event.httpMethod === 'OPTIONS') {
            return successHandler({ message: 'success', cors: true, httpMethod: 'OPTIONS' });
        }

        const body = JSON.parse(event.body);

        if (event.httpMethod === 'GET') {
            const queryStr = event.queryStringParameters;
            if (queryStr?.requestType === BackendRequestType.Comment) {
                const comments = await getComments(`/${queryStr.page}`);
                return successHandler({ data: comments, cors: true });
            } else {
                return errorHandler({ error: new Error('Invalid request type'), cors: true })
            }
        }

        let timestamp = '';
        if (process.env.IS_OFFLINE || !isBot(event.requestContext.identity.userAgent)) {
            switch (body.requestType) {
                case BackendRequestType.Comment:
                    timestamp = await newComment(event.httpMethod, body.page, body.username, body.comment, body.guid);
                    await notifyComment(event.httpMethod, body.page, body.username, body.comment);
                    break;
                case BackendRequestType.Feedback:
                    validateIsPost(event);
                    await insertFeedback(body.page, body.action);
                    break;
                case BackendRequestType.Visit:
                    validateIsPost(event);
                    await insertVisit(body.page, body.action);
                    break;
            }
        }

        const response = { message: 'success', cors: true } as HttpResponseOptions;

        if (timestamp)
            response.data = { timestamp };

        return successHandler(response);
    } catch (err) {
        console.error(err);
        return errorHandler({ error: err, cors: true });
    }
}