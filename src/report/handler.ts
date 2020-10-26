import * as AWS from 'aws-sdk';
import * as moment from 'moment';

const documentclient = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10', region: process.env.REGION });
const ses = new AWS.SES({ apiVersion: '2010-12-01', region: process.env.REGION });

interface QueryResult {
    Items: AWS.DynamoDB.DocumentClient.ItemList;
    ConsumedCapacity: number;
}

const query = async (period: string, lastEvaluatedKey?: AWS.DynamoDB.DocumentClient.Key): Promise<QueryResult> => {

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

    const data = await documentclient.query(params).promise();

    const result: QueryResult = {
        Items: data.Items,
        ConsumedCapacity: data.ConsumedCapacity.CapacityUnits
    }

    if (data.LastEvaluatedKey) {
        const recursiveData = await query(period, data.LastEvaluatedKey);
        result.Items.push(...recursiveData.Items);
        result.ConsumedCapacity += recursiveData.ConsumedCapacity;
    }

    return result;
}

export const report = async (): Promise<void> => {

    const period = moment().subtract(1, 'months').format('YYYY-MM');

    const result = await query(period);

    const pageCounts = {};
    for (const item of result.Items) {

        pageCounts[item.Page] = pageCounts[item.Page] || {
            CountReads: 0,
            CountClicks: 0
        };

        switch (item.Action) {
            case 'read':
                pageCounts[item.Page].CountReads++;
                break;
            case 'clicked':
                pageCounts[item.Page].CountClicks++;
                break;
        }
    }

    let html = '';
    for (const key in pageCounts) {
        html += `Page ${key} had ${pageCounts[key].CountReads} reads and ${pageCounts[key].CountClicks} clicks. <br>`;
    }

    if (Object.keys(pageCounts).length === 0) {
        html += 'There were no visits in this month. <br>';
    }

    html += '<br>';
    html += `ConsumedCapacity: ${result.ConsumedCapacity}`;

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