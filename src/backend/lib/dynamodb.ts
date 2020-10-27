import * as AWS from 'aws-sdk';
import * as moment from 'moment';

const documentClient = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10', region: process.env.REGION });

export const insertVisit = async (page: string, action: string): Promise<void> => {
    await documentClient.put({
        TableName: 'Visits',
        Item: {
            YearMonth: moment().format('YYYY-MM'),
            Timestamp: moment().format('YYYY-MM-DDThh:mm:ss.SSSZ'),
            Page: page,
            Action: action
        }
    }).promise();
}

export const insertFeedback = async (page: string, action: string): Promise<void> => {
    await documentClient.put({
        TableName: 'Feedback',
        Item: {
            Page: page,
            Timestamp: moment().format('YYYY-MM-DDThh:mm:ss.SSSZ'),
            Action: action
        }
    }).promise();
}