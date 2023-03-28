import { promises as fs } from 'node:fs'
import * as jsonc from 'jsonc-parser'

export type JsonPrimitive = string | boolean | number | null | undefined
export type JsonArray = JsonValue[]
export type JsonObject = { [key: string]: JsonValue }
export type JsonValue = JsonObject | JsonArray | JsonPrimitive

export class JsonError extends Error {
    public readonly code: jsonc.ParseErrorCode
    public readonly offset: number
    public readonly length: number
    constructor({ error, offset, length }: jsonc.ParseError) {
        super(`JSON parse error: ${jsonc.printParseErrorCode(error)} Offset: ${offset} Length: ${length}`)
        this.code = error
        this.offset = offset
        this.length = length
    }
}

export class MultiError extends Error {
    constructor(public readonly errors: readonly Error[]) {
        super(errors.map(e => e.message).join('\n'))
    }
}

export function parseJson<T = JsonValue>(content: string): T & JsonValue {
    const errors: jsonc.ParseError[] = []
    const data = jsonc.parse(content, errors) as T & JsonValue
    if (errors.length === 1) throw new JsonError(errors[0])
    if (errors.length > 1) throw new MultiError(errors.map(e => new JsonError(e)))
    return data
}

export async function readJson<T = JsonValue>(path: string): Promise<T & JsonValue> {
    return parseJson(await fs.readFile(path, { encoding: 'utf8' }))
}

type Formatter = (content: string) => string

export async function writeJson<T = JsonValue>(path: string, data: T, formatter: Formatter = a => a): Promise<void> {
    await fs.writeFile(path, formatter(JSON.stringify(data)), { encoding: 'utf8' })
}
