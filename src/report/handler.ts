import * as AWS from 'aws-sdk';
import * as moment from 'moment';
import { FeedbackType, VisitType } from '../common/types';

const documentClient = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10', region: process.env.REGION });
const ses = new AWS.SES({ apiVersion: '2010-12-01', region: process.env.REGION });

interface QueryResult {
    Items: AWS.DynamoDB.DocumentClient.ItemList;
    ConsumedCapacity: number;
}

const scanFeedback = async (lastEvaluatedKey?: AWS.DynamoDB.DocumentClient.Key): Promise<QueryResult> => {

    const params: AWS.DynamoDB.DocumentClient.ScanInput = {
        TableName: 'Feedback',
        Select: 'SPECIFIC_ATTRIBUTES',
        ProjectionExpression: 'Page, #A',
        ExpressionAttributeNames: { '#A': 'Action' }, // Action is a reserved word
        ConsistentRead: false,
        ReturnConsumedCapacity: 'TOTAL'
    };

    if (lastEvaluatedKey) {
        params.ExclusiveStartKey = lastEvaluatedKey;
    }

    const data = await documentClient.scan(params).promise();

    const result: QueryResult = {
        Items: data.Items,
        ConsumedCapacity: data.ConsumedCapacity.CapacityUnits
    }

    if (data.LastEvaluatedKey) {
        const recursiveData = await scanFeedback(data.LastEvaluatedKey);
        result.Items.push(...recursiveData.Items);
        result.ConsumedCapacity += recursiveData.ConsumedCapacity;
    }

    return result;
}

const queryVisits = async (period: string, lastEvaluatedKey?: AWS.DynamoDB.DocumentClient.Key): Promise<QueryResult> => {

    const params: AWS.DynamoDB.DocumentClient.QueryInput = {
        TableName: 'Visits',
        Select: 'SPECIFIC_ATTRIBUTES',
        ProjectionExpression: 'Page, #A',
        ExpressionAttributeNames: { '#A': 'Action' }, // Action is a reserved word
        ExpressionAttributeValues: {
            ':period': period
        },
        KeyConditionExpression: 'YearMonth = :period',
        ConsistentRead: false,
        ReturnConsumedCapacity: 'TOTAL'
    };

    if (lastEvaluatedKey) {
        params.ExclusiveStartKey = lastEvaluatedKey;
    }

    const data = await documentClient.query(params).promise();

    const result: QueryResult = {
        Items: data.Items,
        ConsumedCapacity: data.ConsumedCapacity.CapacityUnits
    }

    if (data.LastEvaluatedKey) {
        const recursiveData = await queryVisits(period, data.LastEvaluatedKey);
        result.Items.push(...recursiveData.Items);
        result.ConsumedCapacity += recursiveData.ConsumedCapacity;
    }

    return result;
}

const getFeedbackValues = (feedbackCounts): string => {
    if (feedbackCounts) {
        const likesSymbol = feedbackCounts.CountLikes > 0 ? '+' : '';
        const dislikesSymbol = feedbackCounts.CountDislikes > 0 ? '-' : '';
        return `(${likesSymbol}${feedbackCounts.CountLikes}/${dislikesSymbol}${feedbackCounts.CountDislikes})`;
    } else {
        return '';
    }
}

export const report = async (): Promise<void> => {

    const period = moment().subtract(1, 'months').format('YYYY-MM');

    const feedback = await scanFeedback();
    const visits = await queryVisits(period);

    const feedbackCounts = {};
    for (const item of feedback.Items) {

        feedbackCounts[item.Page] = feedbackCounts[item.Page] || {
            CountLikes: 0,
            CountDislikes: 0
        };

        switch (item.Action) {
            case FeedbackType.Like:
                feedbackCounts[item.Page].CountLikes++;
                break;
            case FeedbackType.Dislike:
                feedbackCounts[item.Page].CountDislikes++;
                break;
        }
    }

    const pageCounts = {};
    for (const item of visits.Items) {

        pageCounts[item.Page] = pageCounts[item.Page] || {
            CountReads: 0,
            CountClicks: 0
        };

        switch (item.Action) {
            case VisitType.Read:
                pageCounts[item.Page].CountReads++;
                break;
            case VisitType.Clicked:
                pageCounts[item.Page].CountClicks++;
                break;
        }
    }

    let total = 0;
    let html = '';
    for (const key in pageCounts) {
        total += pageCounts[key].CountReads + pageCounts[key].CountClicks;
        const feedbackValues = getFeedbackValues(feedbackCounts[key]);
        html += `Page ${key} had ${pageCounts[key].CountReads} reads and ${pageCounts[key].CountClicks} clicks ${feedbackValues} <br>`;
    }

    if (total > 0) {
        html += `Total: ${total} <br>`;
    } else {
        html += 'There were no visits in this month. <br>';
    }

    html += '<br>';
    html += `Consumed capacity for Feedback: ${feedback.ConsumedCapacity} <br>`;
    html += `Consumed capacity for Visits: ${visits.ConsumedCapacity}`;

    await ses.sendEmail({
        Source: process.env.EMAIL,
        Destination: {
            ToAddresses: [process.env.EMAIL]
        },
        Message: {
            Subject: {
                Data: `Visits report for period ${period}`
            },
            Body: {
                Html: {
                    Charset: 'UTF-8',
                    Data: html
                }
            }
        }
    }).promise();
}