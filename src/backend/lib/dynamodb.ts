import * as AWS from 'aws-sdk';
import * as marked from 'marked';
import * as moment from 'moment';

const documentClient = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10', region: process.env.REGION });

const validateSize = (text: string, minLimit: number, maxLimit: number): void => {
    if (text.length > maxLimit)
        throw new Error('Text is bigger than its limit size.')
    if (text.length < minLimit)
        throw new Error('Text is smaller than its limit size.')
}

interface QueryResult {
    username: string;
    comment: string;
    timestamp: string;
}

const queryComments = async (page: string, lastEvaluatedKey?: AWS.DynamoDB.DocumentClient.Key): Promise<QueryResult[]> => {

    const params: AWS.DynamoDB.DocumentClient.QueryInput = {
        TableName: 'Comments',
        Select: 'SPECIFIC_ATTRIBUTES',
        ProjectionExpression: 'Username, #C, #T',
        ExpressionAttributeNames: { // Comment and Timestamp are reserved words
            '#C': 'Comment',
            '#T': 'Timestamp'
        },
        ExpressionAttributeValues: {
            ':page': page
        },
        KeyConditionExpression: 'Page = :page',
        ConsistentRead: false,
        ReturnConsumedCapacity: 'TOTAL'
    };

    if (lastEvaluatedKey) {
        params.ExclusiveStartKey = lastEvaluatedKey;
    }

    const data = await documentClient.query(params).promise();

    const result: QueryResult[] = [];
    for (const item of data.Items) {
        result.push({
            username: item.Username,
            comment: marked(item.Comment),
            timestamp: item.Timestamp
        });
    }

    if (data.LastEvaluatedKey) {
        const recursiveData = await queryComments(page, data.LastEvaluatedKey);
        result.push(...recursiveData);
    }

    return result;
}

export const getComments = async (page: string): Promise<QueryResult[]> => {

    validateSize(page, 5, 150);

    return await queryComments(page);
}

export const newComment = async (httpMethod: string, page: string, username: string, comment: string, guid: string): Promise<string> => {

    validateSize(page, 5, 150);
    validateSize(guid, 36, 36);
    validateSize(username, 2, 100);
    validateSize(comment, 10, 5000);

    const timestamp = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZ');

    switch (httpMethod) {
        case 'POST':
            await documentClient.put({
                TableName: 'Comments',
                Item: {
                    Page: page,
                    GUID: guid,
                    Username: username,
                    Comment: comment,
                    Timestamp: timestamp
                }
            }).promise();
            break;
        case 'PUT':
            await documentClient.update({
                TableName: 'Comments',
                Key: {
                    'Page': page,
                    'GUID': guid
                },
                UpdateExpression: 'set Username = :username, #C = :comment',
                ExpressionAttributeNames: { '#C': 'Comment' }, // Comment is a reserved word
                ExpressionAttributeValues: {
                    ':comment': comment,
                    ':username': username
                },
                ConditionExpression: 'attribute_exists(Page) and attribute_exists(GUID)'
            }).promise();
            break;
        case 'DELETE':
            await documentClient.delete({
                TableName: 'Comments',
                Key: {
                    'Page': page,
                    'GUID': guid
                },
                ConditionExpression: 'attribute_exists(Page) and attribute_exists(GUID)'
            }).promise();
            break;
    }

    return timestamp;
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