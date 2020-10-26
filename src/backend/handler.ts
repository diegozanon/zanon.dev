import { APIGatewayProxyResult, APIGatewayProxyEvent } from 'aws-lambda';
import { successHandler, errorHandler } from '../common/http-response';
import { BackendRequestType } from '../common/types';
import { getComments, registerComment } from './lib/comment';
import { registerFeedback } from './lib/feedback';
import { registerVisit } from './lib/visit';

export const backend = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

    try {
        if (event.httpMethod === 'OPTIONS') {
            return successHandler({ message: 'success', cors: true, httpMethod: 'OPTIONS' });
        }

        const body = JSON.parse(event.body);

        if (event.httpMethod === 'GET') {
            const queryStr = event.queryStringParameters;
            if (queryStr && queryStr.requestType === BackendRequestType.Comment) {
                return await getComments(event);
            } else {
                return errorHandler({ error: new Error('Invalid request type'), cors: true })
            }
        }

        switch (body.requestType) {
            case BackendRequestType.Comment:
                await registerComment(event);
                break;
            case BackendRequestType.Feedback:
                await registerFeedback(event);
                break;
            case BackendRequestType.Visit:
                await registerVisit(event);
                break;
        }

        return successHandler({ message: 'success', cors: true });
    } catch (err) {
        console.error(err);
        return errorHandler({ error: err, cors: true });
    }
}