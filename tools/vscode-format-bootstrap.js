#!/usr/bin/env node
let source
try {
    source = require.resolve('../dist/build/tools/vscode-format')
} catch {
    require('ts-node/register')
    source = require.resolve('./vscode-format')
}
require(source)
