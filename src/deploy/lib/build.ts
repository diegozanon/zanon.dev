import * as childProcess from 'child_process';
import * as fse from 'fs-extra';

export const build = async (output: string): Promise<void> => {

    await fse.move('./node_modules', `${output}/node_modules`);

    const args = `run build --prefix ${output}`.split(' ');
    await new Promise((resolve, reject) => {
        const npmRunBuild = childProcess.spawn('npm', args);

        // npmRunBuild.stdout.on('data', console.log)); // uncomment if need to log

        npmRunBuild.stderr.on('data', reject);

        npmRunBuild.on('close', code => {
            code == 0 ? resolve() : reject(code);
        });
    });
}