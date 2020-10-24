import { APIGatewayProxyResult, APIGatewayProxyEvent } from 'aws-lambda';
import { successHandler, errorHandler } from '../common/http-response';
import { BackendRequestType } from '../common/types';
import { registerComment } from './lib/comment';
import { registerFeedback } from './lib/feedback';
import { registerVisit } from './lib/visit';

export const backend = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

    if (event.httpMethod === 'OPTIONS') {
        return successHandler({ message: 'success', cors: true, httpMethod: 'OPTIONS' });
    }

    try {
        const body = JSON.parse(event.body);

        switch (body.requestType) {
            case BackendRequestType.Comment:
                await registerComment(body);
                break;
            case BackendRequestType.Feedback:
                await registerFeedback(body);
                break;
            case BackendRequestType.Visit:
                await registerVisit(body);
                break;
        }

        return successHandler({ message: 'success', cors: true });
    } catch (err) {
        console.error(err);
        return errorHandler({ error: err, cors: true });
    }
}