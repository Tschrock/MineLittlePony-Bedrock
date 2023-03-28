import { Readable } from 'node:stream'

import yauzl, { Entry, Options, ZipFile } from 'yauzl'

export function openZip(path: string, options: Options): Promise<ZipFile> {
    return new Promise((resolve, reject) => yauzl.open(path, options,
        (err, zipfile) => err ? reject(err) : resolve(zipfile)
    ))
}

export function readAllEntries(zipFile: ZipFile): Promise<Map<string, Entry>> {
    return new Promise<Map<string, Entry>>((resolve, reject) => {
        const entries = new Map<string, Entry>()
        zipFile.on('entry', (entry: Entry) => {
            entries.set(entry.fileName, entry)
            zipFile.readEntry()
        })
        zipFile.on('end', () => resolve(entries))
        zipFile.on('error', reject)
        zipFile.readEntry()
    })
}

export function openReadStream(zipFile: ZipFile, entry: Entry): Promise<Readable> {
    return new Promise((resolve, reject) => {
        zipFile.openReadStream(entry, (err, stream) => err ? reject(err) : resolve(stream))
    })
}

function readAll(stream: Readable, encoding: BufferEncoding): Promise<string> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = []
        stream.on('data', (chunk: Buffer) => chunks.push(chunk))
        stream.on('error', reject)
        stream.on('end', () => resolve(Buffer.concat(chunks).toString(encoding)))
    })
}

export async function readEntryContent(zipFile: ZipFile, entry: Entry): Promise<string> {
    return await readAll(await openReadStream(zipFile, entry), 'utf-8')
}
