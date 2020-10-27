import { APIGatewayProxyEvent } from 'aws-lambda';
import { isBot } from './bot';
import { insertFeedback } from './dynamodb';

export const registerFeedback = async (event: APIGatewayProxyEvent): Promise<void> => {
    if (!isBot(event.requestContext.identity.userAgent)) {
        const body = JSON.parse(event.body);
        await insertFeedback(body.page, body.action);
    }
}