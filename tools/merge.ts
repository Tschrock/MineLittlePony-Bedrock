import path from 'node:path';
import { Stats, promises as fs } from 'node:fs';
import { Transform, TransformCallback } from 'node:stream'

import Vinyl from 'vinyl'
import { Entry, ZipFile } from 'yauzl'

import { fetchToFile } from './download';
import { openZip, readAllEntries, readEntryContent } from './zip';
import { JsonArray, JsonObject, JsonValue, parseJson } from './json';
import { JSONPath } from 'jsonc-parser';

const DEFAULT_PACK: PackDetails = {
    url: new URL('https://github.com/Mojang/bedrock-samples/archive/refs/tags/v1.19.70.2.zip'),
    behaviors: 'bedrock-samples-1.19.70.2/behavior_pack/',
    resources: 'bedrock-samples-1.19.70.2/resource_pack/'
}

async function tryStat(path: string): Promise<Stats | false> {
    try {
        return await fs.stat(path)
    } catch (e) {
        const error = e as NodeJS.ErrnoException
        if (error.code === 'ENOENT') {
            return false
        } else {
            throw e
        }
    }
}
const dowloading = new Map<string, Promise<void>>()
async function getVanillaAssets(url: URL = DEFAULT_PACK.url): Promise<string> {
    const fileName = path.basename(url.pathname)
    const filePath = path.join('.cache', fileName)
    if (!await tryStat(filePath)) {
        let task = dowloading.get(filePath)
        if (task) {
            await task
        } else {
            task = fetchToFile(url, filePath)
            dowloading.set(filePath, task)
            await task
            dowloading.delete(filePath)
        }
    }
    return filePath
}

interface PackDetails {
    url: URL,
    behaviors: string,
    resources: string,
}

export async function mergeVanillaBehaviors(packDetails: PackDetails = DEFAULT_PACK) {
    return mergeVanilla(packDetails.url, packDetails.behaviors)
}

export async function mergeVanillaResources(packDetails: PackDetails = DEFAULT_PACK) {
    return mergeVanilla(packDetails.url, packDetails.resources)
}

async function mergeVanilla(url: URL, prefix: string) {
    // Get vanilla assets zip
    const assetsPath = await getVanillaAssets(url)
    // Open zip
    const zipFile = await openZip(assetsPath, {
        lazyEntries: true,
        autoClose: false,
    })
    // Read all entries
    const entries = await readAllEntries(zipFile)
    return new PackTransform(zipFile, entries, prefix)
}

class PackTransform extends Transform {
    constructor(
        private file: ZipFile,
        private entries: Map<string, Entry>,
        private prefix: string
    ) {
        super({ objectMode: true })
    }
    _transform(file: Vinyl, encoding: BufferEncoding, callback: TransformCallback): void {
        this._transformAsync(file, encoding).then(
            result => callback(null, result),
            callback
        )
    }
    private async tryGetVanilla(filePath: string): Promise<string | undefined> {
        const vanillaFile = this.entries.get(path.join(this.prefix, filePath))
        if (vanillaFile) {
            return readEntryContent(this.file, vanillaFile)
        } else {
            console.log(`Could not find vanilla file for ${filePath}`)
            return
        }
    }
    private async _transformAsync(file: Vinyl, _: BufferEncoding): Promise<Vinyl> {
        if (file.isBuffer()) {
            if (file.relative.startsWith('entities/') || file.basename.includes('.merge.')) {
                file.basename = file.basename.replace('.merge.', '.')
                const vanillaContent = await this.tryGetVanilla(file.relative)
                if (vanillaContent) {
                    const fileContent = file.contents.toString('utf-8')
                    const mergedData = mergeEntities(parseJson(vanillaContent), parseJson(fileContent))
                    file.contents = Buffer.from(JSON.stringify(mergedData), 'utf-8')
                }
            }
        }
        return file
    }
}

function mergeEntities(a: JsonValue, b: JsonValue): JsonValue {
    return deepMerge([], a, b,
        (_, a, b, __): JsonValue => {
            return [...b, ...a]
        },
        (path, a, b, merge): JsonValue => {
            const keys = Array.from(new Set(Object.keys(b).concat(Object.keys(a))))
            return Object.fromEntries(keys.map(k => [k, merge([...path, k], a[k], b[k])]))
        }
    )
}

function deepMerge(
    path: JSONPath,
    a: JsonValue,
    b: JsonValue,
    arrayMerge: (path: JSONPath, a: JsonArray, b: JsonArray, merge: (path: JSONPath, a: JsonValue, b: JsonValue) => JsonValue) => JsonValue,
    objectMerge: (path: JSONPath, a: JsonObject, b: JsonObject, merge: (path: JSONPath, a: JsonValue, b: JsonValue) => JsonValue) => JsonValue
): JsonValue {
    if (typeof a === 'string') return a
    else if (typeof a === 'boolean') return a
    else if (typeof a === 'number') return a
    else if (Array.isArray(a)) {
        if (Array.isArray(b)) return arrayMerge(path, a, b, (path, a, b) => deepMerge(path, a, b, arrayMerge, objectMerge))
        else return a
    }
    else if (typeof a === 'undefined') return b
    else if (a === null) return b
    else {
        if (!Array.isArray(b) && typeof b === 'object' && b !== null) return objectMerge(path, a, b, (path, a, b) => deepMerge(path, a, b, arrayMerge, objectMerge))
        else return a
    }
}
