import * as AWS from 'aws-sdk';

const ses = new AWS.SES({ apiVersion: '2010-12-01', region: process.env.REGION });

export const notifyComment = async (httpMethod: string, page: string, username: string, comment: string): Promise<void> => {

    let action = `<unexpected http method: ${httpMethod}>`;
    switch (httpMethod) {
        case 'POST':
            action = 'added';
            break;
        case 'PUT':
            action = 'modified';
            break;
        case 'DELETE':
            action = 'deleted';
            break;
    }

    await ses.sendEmail({
        Source: process.env.EMAIL,
        Destination: {
            ToAddresses: [process.env.EMAIL]
        },
        Message: {
            Subject: {
                Data: `User "${username}" ${action} a comment on page ${page}`
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