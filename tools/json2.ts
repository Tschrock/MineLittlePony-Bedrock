import assert from 'node:assert'
import { promises as fs } from 'node:fs'
import * as jsonc from 'jsonc-parser'
import { JsonValue, parseJson } from './json'

/**
 * Modifies a JSON file, attempting to preserve comments and formatting.
 * @param path The path to the JSON file.
 * @param transformer A transform function that modifies the file's data.
 */
export async function modifyJsonFile<T = JsonValue>(
    path: string,
    transformer: (data: T & JsonValue) => T & JsonValue | undefined | void,
    formatter?: (content: string) => string,
): Promise<void> {
    const originalContent = await fs.readFile(path, { encoding: 'utf8' })

    const originalData: T & JsonValue = parseJson<T>(originalContent)

    let transformedData = structuredClone(originalData)
    transformedData = transformer(transformedData) ?? transformedData

    const changes = deepCompare(originalData, transformedData)

    if (!changes.length) return

    let modifiedContent = originalContent
    for (const change of changes) {
        const edits = jsonc.modify(modifiedContent, change.path, change.b, {})
        modifiedContent = jsonc.applyEdits(modifiedContent, edits)
    }

    if (formatter) {
        modifiedContent = formatter(modifiedContent)
    }

    // Sanity check
    assert.deepStrictEqual(transformedData, parseJson(modifiedContent))

    await fs.writeFile(path, modifiedContent, { encoding: 'utf8' })
}

interface Diff {
    path: jsonc.JSONPath
    a: JsonValue
    b: JsonValue
}

export function deepCompare(a: JsonValue, b: JsonValue, path: jsonc.JSONPath = []): Diff[] {
    // JsonArray
    if (Array.isArray(a)) {
        if (Array.isArray(b)) {
            const diffs: Diff[] = []
            const maxLen = Math.max(a.length, b.length)
            for (let i = 0; i < maxLen; i++) {
                diffs.push(...deepCompare(a[i], b[i], [...path, i]))
            }
            return diffs
        }
        return [{ path, a, b }]
    } else if (Array.isArray(b)) {
        return [{ path, a, b }]
    }
    // JsonObject
    if (typeof a === 'object' && a !== null) {
        if (typeof b === 'object' && b !== null) {
            const allKeys = new Set<string>([
                ...Object.keys(a),
                ...Object.keys(b),
            ])
            const diffs: Diff[] = []
            for (const key of allKeys) {
                diffs.push(...deepCompare(a[key], b[key], [...path, key]))
            }
            return diffs
        }
        return [{ path, a, b }]
    }
    // JsonPrimitive
    return a !== b ? [{ path, a, b }] : []
}
