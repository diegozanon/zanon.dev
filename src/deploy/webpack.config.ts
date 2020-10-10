import * as slsw from 'serverless-webpack';
import * as path from 'path';

module.exports = {
    entry: slsw.lib.entries,
    target: 'node',
    mode: 'production',
    module: {
        rules: [
            { test: /\.ts$/, use: 'ts-loader' }
        ]
    },
    output: {
        libraryTarget: 'commonjs',
        path: path.resolve('./src/deploy/.build')
    },
};