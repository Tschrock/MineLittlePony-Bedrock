import { promises as fs } from 'node:fs';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import type { ReadableStream } from 'node:stream/web';
import { TransformCallback } from 'stream';

export async function fetchToFile(input: URL, destination: string, init?: RequestInit | undefined): Promise<void> {
    console.log(`Downloading ${input.href}`)
    const response = await fetch(input, init)
    if (!response.ok) throw new Error(`Bad response: ${response.status} ${response.statusText}`)
    if (!response.body) throw new Error(`Response has no body? ${response.status} ${response.statusText}`)
    const file = await fs.open(destination, 'w')
    await pipeline(
        Readable.fromWeb(response.body as ReadableStream),
        new ProgressReporter(response),
        file.createWriteStream({ autoClose: true })
    )
    console.log('Download complete')
}

class ProgressReporter extends Transform {
    private bytes = 0
    private lastPrint = performance.now()
    private lastAverageTotal = 0
    private contentLength: number | undefined
    constructor(response: Response) {
        super()
        const length = response.headers.get('content-length')
        this.contentLength = length ? Number.parseInt(length) : undefined
    }
    override _transform(chunk: Buffer, _: BufferEncoding, callback: TransformCallback): void {
        const now = performance.now()
        this.bytes += chunk.length
        this.lastAverageTotal += chunk.length
        if (this.lastPrint + 2000 < now) {
            const average = this.lastAverageTotal / 2
            this.lastPrint = now
            this.lastAverageTotal = 0
            console.log(`Downloading ${prefix(this.bytes)}${this.contentLength ? ` of ${prefix(this.contentLength)}` : ''} (${prefix(average)}/sec)...`)
        }
        callback(null, chunk)
    }
}

const sizes = [[1000000000, 'GB'], [1000000, 'MB'], [1000, 'KB'], [1, 'B']] as const
function prefix(size: number): string {
    const [mag, prefix] = sizes.find(s => size > s[0]) ?? [1, 'B']
    return `${(size / mag).toFixed(size > mag * 10 ? 0 : 1)} ${prefix}`
}
