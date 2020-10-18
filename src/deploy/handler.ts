import * as childProcess from 'child_process';
import { download, DownloadOptions } from 'get-github-code';
import * as fse from 'fs-extra';

export const deploy = async (): Promise<void> => {

    const output = './downloaded';

    // dowload the updated project
    const options: DownloadOptions = {
        username: 'diegozanon',
        repo: 'zanon.dev',
        branch: 'feature/r01/deploy',
        output
    };

    await download(options);

    await fse.copy('./node_modules', `${output}/node_modules`);

    const args = `run build --prefix ${output}`.split(' ');
    await new Promise((resolve, reject) => {
        const npmRunBuild = childProcess.spawn('npm', args);

        npmRunBuild.stdout.on('data', () => {
            // console.info(`Build: ${data}`); // log only if debug is needed
        });

        npmRunBuild.stderr.on('data', reject);

        npmRunBuild.on('close', code => {
            code == 0 ? resolve() : reject(code);
        });
    });
}