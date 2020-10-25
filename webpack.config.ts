import * as slsw from 'serverless-webpack';
import * as path from 'path';

module.exports = {
    entry: slsw.lib.entries,
    externals: /^aws-sdk.*$/i, // aws-sdk is already available in Lambda environment, don't bundle it
    target: 'node',
    mode: 'production',
    module: {
        rules: [
            { test: /\.ts$/, use: 'ts-loader' }
        ]
    },
    resolve: {
        extensions: ['.ts', '.js']
    },
    output: {
        libraryTarget: 'commonjs',
        path: path.resolve('./.build')
    }
};