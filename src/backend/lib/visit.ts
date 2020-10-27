import { APIGatewayProxyEvent } from 'aws-lambda';
import { isBot } from './bot';
import { insertVisit } from './dynamodb';

export const registerVisit = async (event: APIGatewayProxyEvent): Promise<void> => {
    if (!isBot(event.requestContext.identity.userAgent)) {
        const body = JSON.parse(event.body);
        await insertVisit(body.page, body.action);
    }
}