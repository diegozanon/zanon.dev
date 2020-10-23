import { APIGatewayProxyEvent } from 'aws-lambda';
import { isValid } from '../../src/deploy/lib/validate';

describe('validate', () => {

    process.env.WEBHOOK_SECRET = 'abc123';

    it('accepts a valid webhook request if ref is master or main', () => {

        const event = {} as APIGatewayProxyEvent;

        event.headers = { 'X-Hub-Signature': 'sha1=6d29ac3acd18639c4d6dd2ed48862c2717f37e6a' };
        event.body = JSON.stringify({ ref: 'refs/heads/master' });
        expect(isValid(event)).toBeTruthy();

        event.headers = { 'X-Hub-Signature': 'sha1=bd8a0e6270cb7e38bb90aea639b8cff06c222c91' };
        event.body = JSON.stringify({ ref: 'refs/heads/main' });
        expect(isValid(event)).toBeTruthy();
    });

    it('rejects a valid webhook request if ref is another branch', () => {

        const event = {} as APIGatewayProxyEvent;
        event.headers = { 'X-Hub-Signature': 'sha1=20f68bd1665353b5c629e46622923ef57a9fe23d' };
        event.body = JSON.stringify({ ref: 'refs/heads/develop' });

        expect(isValid(event)).toBeFalsy();
    });

    it('throws if webhook request was incorrectly signed', () => {

        const event = {} as APIGatewayProxyEvent;
        event.headers = { 'X-Hub-Signature': 'anything' };
        event.body = JSON.stringify({ msg: 'something' });

        expect(() => isValid(event)).toThrow();
    });
});
