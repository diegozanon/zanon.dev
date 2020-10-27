import { APIGatewayProxyResult, APIGatewayProxyEvent } from 'aws-lambda';
import { successHandler, errorHandler } from '../common/http-response';
import { BackendRequestType } from '../common/types';
import { isBot } from './lib/bot';
import { insertFeedback, insertVisit } from './lib/dynamodb';

export const backend = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

    try {
        if (event.httpMethod === 'OPTIONS') {
            return successHandler({ message: 'success', cors: true, httpMethod: 'OPTIONS' });
        }

        const body = JSON.parse(event.body);

        if (event.httpMethod === 'GET') {
            const queryStr = event.queryStringParameters;
            if (queryStr && queryStr.requestType === BackendRequestType.Comment) {
                // const comments = await getComments(event);
                // return successHandler({ data: comments, cors: true });
                return successHandler({ data: event, cors: true });
            } else {
                return errorHandler({ error: new Error('Invalid request type'), cors: true })
            }
        }

        if (!isBot(event.requestContext.identity.userAgent)) {
            switch (body.requestType) {
                case BackendRequestType.Comment:
                    // await insertComment();
                    break;
                case BackendRequestType.Feedback:
                    await insertFeedback(body.page, body.action);
                    break;
                case BackendRequestType.Visit:
                    await insertVisit(body.page, body.action);
                    break;
            }
        }

        return successHandler({ message: 'success', cors: true });
    } catch (err) {
        console.error(err);
        return errorHandler({ error: err, cors: true });
    }
}