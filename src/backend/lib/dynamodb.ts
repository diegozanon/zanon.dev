import * as AWS from 'aws-sdk';
import * as moment from 'moment';

const documentClient = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10', region: process.env.REGION });

const validateSize = (text: string, minLimit: number, maxLimit: number): void => {
    if (text.length > maxLimit)
        throw new Error('Text is bigger than its limit size.');
    if (text.length < minLimit)
        throw new Error('Text is smaller than its limit size.');
}

export const insertVisit = async (page: string, action: string): Promise<void> => {

    validateSize(page, 1, 150);
    validateSize(action, 4, 7);

    await documentClient.put({
        TableName: 'Visits',
        Item: {
            YearMonth: moment().format('YYYY-MM'),
            Timestamp: moment().format('YYYY-MM-DDTHH:mm:ss.SSSZ'),
            Page: page,
            Action: action
        }
    }).promise();
}

export const insertFeedback = async (page: string, action: string): Promise<void> => {

    validateSize(page, 5, 150);
    validateSize(action, 4, 7);

    await documentClient.put({
        TableName: 'Feedback',
        Item: {
            Page: page,
            Timestamp: moment().format('YYYY-MM-DDTHH:mm:ss.SSSZ'),
            Action: action
        }
    }).promise();
}

export const newsletter = async (httpMethod: string, email: string): Promise<void> => {

    validateSize(email, 6, 100);

    if (!email.includes('@'))
        throw new Error('E-mail must contain an "@" sign.');
    if (!email.includes('.'))
        throw new Error('E-mail  must contain an "." sign.');

    switch (httpMethod) {
        case 'POST': // subscribe
            await documentClient.put({
                TableName: 'Newsletter',
                Item: {
                    Email: email,
                    Timestamp: moment().format('YYYY-MM-DDTHH:mm:ss.SSSZ')
                }
            }).promise();
            break;
        case 'DELETE': // unsubscribe
            await documentClient.delete({
                TableName: 'Newsletter',
                Key: {
                    'Email': email
                }
            }).promise();
            break;
        default:
            throw new Error(`Unexpected http method for newsletter: ${httpMethod}`);
    }
}