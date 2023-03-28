import { Transform, TransformCallback } from "node:stream"
import Vinyl from 'vinyl'
import { parseJson } from "./json"

export function minifyJson() {
    return new MinifyJsonTransform()
}

class MinifyJsonTransform extends Transform {
    constructor() { super({ objectMode: true }) }
    _transform(file: Vinyl, _: BufferEncoding, cb: TransformCallback): void {
        if (file.isBuffer()) {
            const content = file.contents.toString('utf-8')
            const minified = JSON.stringify(parseJson(content))
            file.contents = Buffer.from(minified, "utf-8")
        }
        cb(null, file)
    }
}
