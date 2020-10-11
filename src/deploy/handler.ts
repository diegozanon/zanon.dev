import { promisify } from 'util';
import * as childProcess from 'child_process';

const exec = promisify(childProcess.exec);

export const deploy = async (): Promise<void> => {
    const { stdout, stderr } = await exec('npm run build');
}