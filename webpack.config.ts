import path from 'path';

const srcRoot = path.resolve(__dirname, 'behavior-pack');
const outRoot = path.resolve(__dirname, 'dist', 'build', 'behavior-pack');

export = {
    mode: "production" as const,
    context: srcRoot,
    entry: {
        client: './scripts/client/client.ts',
        server: './scripts/server/server.ts'
    },
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
        filename: 'scripts/[name]/[name].js',
        path: outRoot,
    },
};
