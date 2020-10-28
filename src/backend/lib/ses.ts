import * as AWS from 'aws-sdk';

const ses = new AWS.SES({ apiVersion: '2010-12-01', region: process.env.REGION });

export const notifyComment = async (httpMethod: string, page: string, comment: string): Promise<void> => {
    await ses.sendEmail({
        Source: process.env.EMAIL,
        Destination: {
            ToAddresses: [process.env.EMAIL]
        },
        Message: {
            Subject: {
                Data: `New comment on page ${page} (${httpMethod})`
            },
            Body: {
                Html: {
                    Charset: 'UTF-8',
                    Data: comment
                }
            }
        }
    }).promise();
}