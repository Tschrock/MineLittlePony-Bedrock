import path from 'path';

const srcRoot = path.resolve(__dirname, 'resource-pack');
const outRoot = path.resolve(__dirname, 'dist', 'build', 'resource-pack');

export = {
    mode: "production" as const,
    context: srcRoot,
    entry: './experimental_ui/scripts/main.ts',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    output: {
        filename: './experimental_ui/scripts/main.js',
        path: outRoot,
    },
};
