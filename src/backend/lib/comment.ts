import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { successHandler } from '../../common/http-response';
import { isBot } from './bot';

export const getComments = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    return successHandler({ data: event, cors: true });
}

export const registerComment = async (event: APIGatewayProxyEvent): Promise<void> => {
    if (!isBot(event.requestContext.identity.userAgent)) {
        const body = JSON.parse(event.body);
        // await insertComment(body.page, body.action);
    }
}