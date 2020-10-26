import * as fs from 'fs';
import * as path from 'path';
import { isBot } from '../../src/backend/lib/visit';

describe('visit', () => {

    it('tests if isBot can find most bots user-agents', async () => {
        const botsTxt = await fs.promises.readFile(path.resolve('./tests/data/user-agents/bots.txt'), 'utf8');
        const bots = botsTxt.split('\n');

        let countTotal = 0;
        let countCorrect = 0;
        for (const bot of bots) {
            countTotal++;
            if (isBot(bot))
                countCorrect++;
        }

        expect(countCorrect / countTotal).toBeGreaterThan(0.95);
    });

    it('tests if isBot returns false for all valid user-agents', async () => {
        const humansTxt = await fs.promises.readFile(path.resolve('./tests/data/user-agents/humans.txt'), 'utf8');
        const humans = humansTxt.split('\n');

        let countTotal = 0;
        let countCorrect = 0;
        for (const human of humans) {
            countTotal++;
            if (!isBot(human))
                countCorrect++;
        }

        expect(countCorrect).toBe(countTotal);
    });
})
