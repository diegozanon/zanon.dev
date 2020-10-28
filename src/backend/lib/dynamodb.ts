import * as AWS from 'aws-sdk';
import * as marked from 'marked';
import * as moment from 'moment';

const documentClient = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10', region: process.env.REGION });

const validateSize = (text: string, limit: number): void => {
    if (text.length > limit)
        throw new Error('Text is bigger than its limit size.')
}

interface QueryResult {
    comment: string;
    timestamp: string;
}

const queryComments = async (page: string, lastEvaluatedKey?: AWS.DynamoDB.DocumentClient.Key): Promise<QueryResult[]> => {

    const params: AWS.DynamoDB.DocumentClient.QueryInput = {
        TableName: 'Comments',
        Select: 'SPECIFIC_ATTRIBUTES',
        ProjectionExpression: '#C, #T',
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

    validateSize(page, 150);

    return await queryComments(page);
}

export const newComment = async (httpMethod: string, page: string, comment: string, guid: string): Promise<void> => {

    validateSize(page, 150);
    validateSize(comment, 5000);
    validateSize(guid, 36);

    switch (httpMethod) {
        case 'POST':
            await documentClient.put({
                TableName: 'Comments',
                Item: {
                    Page: page,
                    GUID: guid,
                    Comment: comment,
                    Timestamp: moment().format('YYYY-MM-DDThh:mm:ss.SSSZ')
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
                UpdateExpression: 'set #C = :comment',
                ExpressionAttributeNames: { '#C': 'Comment' }, // Comment is a reserved word
                ExpressionAttributeValues: {
                    ':comment': comment
                },
                ConditionExpression: 'attribute_exists(Page) and attribute_exists(GUID)',
                ReturnValues: 'UPDATED_OLD'
            }).promise();
            break;
        case 'DELETE':
            await documentClient.delete({
                TableName: 'Comments',
                Key: {
                    'Page': page,
                    'GUID': guid
                },
                ConditionExpression: 'attribute_exists(Page) and attribute_exists(GUID)',
                ReturnValues: 'ALL_OLD'
            }).promise();
            break;
    }
}

export const insertVisit = async (page: string, action: string): Promise<void> => {

    validateSize(page, 150);
    validateSize(action, 7);

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

    validateSize(page, 150);
    validateSize(action, 7);

    await documentClient.put({
        TableName: 'Feedback',
        Item: {
            Page: page,
            Timestamp: moment().format('YYYY-MM-DDThh:mm:ss.SSSZ'),
            Action: action
        }
    }).promise();
}