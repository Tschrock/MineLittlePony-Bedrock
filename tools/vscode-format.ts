#!/usr/bin/env node
import { formatJsonString } from './format-json-v3'

async function readTillEnd(stream: NodeJS.ReadStream, encoding = 'utf-8'): Promise<string> {
    return new Promise((resolve, reject) => {
        const dataList: Buffer[] = []
        stream
            .on('error', reject)
            .on('data', dataList.push.bind(dataList))
            .on('end', () => resolve(
                new TextDecoder(encoding).decode(Buffer.concat(dataList))
            ))
            .resume()
    })
}

async function main() {
    const content = await readTillEnd(process.stdin)
    const formatted = formatJsonString(content)
    process.stdout.write(formatted, 'utf-8')
}

main().catch((e: Error) => {
    process.stderr.write(e.message)
    process.exit(1)
})
