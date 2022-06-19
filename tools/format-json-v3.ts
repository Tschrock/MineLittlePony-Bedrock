/*
 * format-json.js
 *
 * Formats all json files in the addon directories using some
 * specific and obscure rules that I think keeps things readable while
 * being somewhat compact.
 *
 * Abandon all hope ye who enter here
 */

import { promises as fs } from 'node:fs'
import { createScanner, parse, ScanError, SyntaxKind } from "jsonc-parser"
import { walk } from './walk'
// import path from 'node:path'

interface ObjectNode {
    type: 'object'
    children: Array<CommentNode | NewLineNode | PropertyNode>
}

interface PropertyNode {
    type: 'property'
    key: LiteralNode
    afterKey: Array<CommentNode | NewLineNode>
    beforeValue: Array<CommentNode | NewLineNode>
    value: ValueNode
    afterValue: Array<CommentNode | NewLineNode>
}

interface ArrayNode {
    type: 'array'
    children: Array<CommentNode | NewLineNode | ItemNode>
}

interface ItemNode {
    type: 'item'
    value: ValueNode
    afterValue: Array<CommentNode | NewLineNode>
}

interface LiteralNode {
    type: 'literal'
    value: string | number | boolean | null
    text?: string
}

type ValueNode = ObjectNode | ArrayNode | LiteralNode

interface CommentNode {
    type: 'comment'
    block: boolean
    value: string
}

interface NewLineNode {
    type: 'newline'
}

interface RootNode {
    beforeValue: Array<CommentNode | NewLineNode>
    value: ValueNode
    afterValue: Array<CommentNode | NewLineNode>
}

const errorStrings = ['None', 'Unexpected End Of Comment', 'Unexpected End Of String', 'Unexpected End Of Number', 'Invalid Unicode', 'Invalid Escape Character', 'Invalid Character']

type JsonPrimitive = string | boolean | number | null | undefined
type JsonArray = JsonValue[]
type JsonObject = { [key: string]: JsonValue }
type JsonValue = JsonObject | JsonArray | JsonPrimitive

function getJsPath<T extends JsonValue>(value: JsonValue, path: readonly string[]): T | undefined {
    const [part, ...rest] = path
    if (!part) return value as T
    if (typeof value === 'object') {
        return getJsPath((value as JsonObject)[part], rest)
    } else if (Array.isArray(value)) {
        return getJsPath((value as JsonArray)[parseInt(part)], rest)
    } else {
        return undefined
    }
}

export function parseTree(data: string): RootNode {
    const scanner = createScanner(data, false)
    let currentToken = scanner.scan()

    function nextToken() {
        currentToken = scanner.scan()
        const error = scanner.getTokenError()
        if (error != ScanError.None) throw new Error(errorStrings[error])
        return currentToken
    }

    function readComment(block: boolean): CommentNode {
        const offset = scanner.getTokenOffset()
        const length = scanner.getTokenLength()
        return { type: 'comment', block, value: data.slice(offset, offset + length) }
    }

    function readTrivia(): Array<CommentNode | NewLineNode> {
        const trivia: Array<CommentNode | NewLineNode> = []
        while (true) {
            switch (currentToken) {
                case SyntaxKind.BlockCommentTrivia:
                    trivia.push(readComment(true))
                    nextToken()
                    break;
                case SyntaxKind.LineCommentTrivia:
                    trivia.push(readComment(false))
                    nextToken()
                    break;
                case SyntaxKind.LineBreakTrivia:
                    trivia.push({ type: 'newline' })
                    nextToken()
                    break;
                case SyntaxKind.Trivia:
                    nextToken()
                    break;
                default:
                    return trivia;
            }
        }
    }

    function readItem(): ItemNode {
        return {
            type: 'item',
            value: readValue(),
            afterValue: readTrivia(),
        }
    }

    function readArray(): ArrayNode {
        nextToken()
        const children: Array<CommentNode | NewLineNode | ItemNode> = []
        let firstItem = true
        while (true) {
            children.push(...readTrivia())
            if (currentToken == SyntaxKind.CloseBracketToken) {
                nextToken()
                return { type: 'array', children }
            }
            if (currentToken === SyntaxKind.CommaToken) {
                if (firstItem) {
                    throw new Error("Expected value or closing bracket")
                } else {
                    nextToken()
                    children.push(...readTrivia())
                }
            }
            children.push(readItem())
            firstItem = false
        }
    }

    function readProperty(): PropertyNode {
        const key = readString()
        const afterKey = readTrivia()
        if (currentToken !== SyntaxKind.ColonToken) {
            throw new Error("Expected token")
        }
        nextToken()
        const beforeValue = readTrivia()
        const value = readValue()
        const afterValue = readTrivia()
        return { type: 'property', key, afterKey, beforeValue, value, afterValue }
    }

    function readObject(): ObjectNode {
        nextToken()
        const children: Array<CommentNode | NewLineNode | PropertyNode> = []
        let firstItem = true
        while (true) {
            children.push(...readTrivia())
            if (currentToken == SyntaxKind.CloseBraceToken) {
                nextToken()
                return { type: 'object', children }
            }
            if (currentToken === SyntaxKind.CommaToken) {
                if (firstItem) {
                    throw new Error("Expected property or closing brace")
                } else {
                    nextToken()
                    children.push(...readTrivia())
                }
            }
            if (currentToken !== SyntaxKind.StringLiteral) {
                throw new Error("Expected property or closing brace")
            }
            children.push(readProperty())
            firstItem = false
        }
    }

    function readString(): LiteralNode {
        const value = scanner.getTokenValue()
        nextToken()
        return { type: 'literal', value }
    }

    function readNumber(): LiteralNode {
        const offset = scanner.getTokenOffset()
        const length = scanner.getTokenLength()
        nextToken()
        return { type: 'literal', value: Number(scanner.getTokenValue()), text: data.slice(offset, offset + length) }
    }

    function readValue(): ValueNode {
        switch (currentToken) {
            case SyntaxKind.OpenBracketToken:
                return readArray()
            case SyntaxKind.OpenBraceToken:
                return readObject()
            case SyntaxKind.StringLiteral:
                return readString()
            case SyntaxKind.NumericLiteral:
                return readNumber()
            case SyntaxKind.NullKeyword:
                nextToken()
                return { type: 'literal', value: null }
            case SyntaxKind.TrueKeyword:
                nextToken()
                return { type: 'literal', value: true }
            case SyntaxKind.FalseKeyword:
                nextToken()
                return { type: 'literal', value: false }
            default:
                throw new Error("Expected JSON Value")
        }
    }

    function readRoot(): RootNode {
        return {
            beforeValue: readTrivia(),
            value: readValue(),
            afterValue: readTrivia(),
        }
    }

    const root = readRoot()
    if (currentToken != SyntaxKind.EOF) {
        throw new Error('Expected EOF')
    }
    return root
}

const arrayCompact = [
    ['header', 'version'],
    ['header', 'min_engine_version'],
    ['modules', '*', 'version'],
    ['dependencies', '*', 'version'],
    ['animations', '*', 'bones', '*', 'rotation'],
    ['animations', '*', 'bones', '*', 'position'],
    ['animations', '*', 'bones', '*', 'scale'],
    ['minecraft:geometry', '*', 'description', 'visible_bounds_offset'],
    ['minecraft:geometry', '*', 'bones', '*', 'pivot'],
    ['minecraft:geometry', '*', 'bones', '*', 'rotation'],
    ['minecraft:geometry', '*', 'bones', '*', 'cubes', '*', 'origin'],
    ['minecraft:geometry', '*', 'bones', '*', 'cubes', '*', 'size'],
    ['render_controllers', '*', 'textures'],
    ['minecraft:geometry', '*', 'bones', '*', 'cubes', '*', 'uv'],
]

const objectCompact = [
    ['minecraft:geometry', '*', 'bones', '*', 'cubes', '*', 'uv', '*'],
    ['animation_controllers', '*', 'states', '*', 'animations', '*'],
    ['animation_controllers', '*', 'states', '*', 'transitions', '*'],
    ['minecraft:attachable', 'description', 'item'],
    ['minecraft:attachable', 'description', 'render_controllers', '*'],
    ['minecraft:client_entity', 'description', 'render_controllers', '*'],
    ['minecraft:client_entity', 'description', 'scripts', 'animate', '*'],
    ['render_controllers', '*', 'part_visibility', '*'],
    ['render_controllers', '*', 'materials', '*'],
]

function matchAny(path: string[], matchers: string[][]): boolean {
    return matchers.some(m => m.length === path.length && m.every((v, i) => v === '*' || v === path[i]))
}

class Stack<T> {
    public data: T[] = []
    push(value: T) {
        this.data.push(value)
    }
    pop(): T | undefined {
        return this.data.pop()
    }
    replace(value: T): T | undefined {
        const oldValue = this.pop()
        this.push(value)
        return oldValue
    }
    peek(): T | undefined {
        return this.data[this.data.length - 1]
    }
}

function formatTree(root: RootNode, indent: string, jsValue: JsonValue): string {
    const path = new Stack<string>()
    let result = ""
    let depth = 0

    function formatComments(compact: boolean, trivia: Array<NewLineNode | CommentNode>, noPadStart = false): NewLineNode | CommentNode | undefined {
        let last: NewLineNode | CommentNode | undefined = undefined
        let lastWritten: NewLineNode | CommentNode | undefined = undefined
        compact
        for (const item of trivia) {
            if (item.type === 'comment') {
                if (last) {
                    if (last.type === 'comment') {
                        if (last.block) {
                            result += ' '
                        } else {
                            result += '\n'
                            result += indent.repeat(depth)
                        }
                        lastWritten = item
                    }
                    else {
                        result += '\n'
                        result += indent.repeat(depth)
                        lastWritten = last
                    }
                } else {
                    if (!noPadStart) {
                        result += ' '
                    }
                    lastWritten = item
                }
                result += item.value.trim()
            }
            last = item
        }
        return lastWritten
    }

    function formatObject(compact: boolean, node: ObjectNode) {
        result += "{"
        compact = compact || matchAny(path.data, objectCompact)
        path.push('{}')
        if (!compact) {
            depth += 1
        }
        let betweenValues: Array<CommentNode | NewLineNode> = []
        let firstItem = true
        let last: CommentNode | NewLineNode | undefined = undefined
        for (const child of node.children) {
            if (child.type !== 'property') {
                betweenValues.push(child)
            } else {
                if (!firstItem) {
                    if (last && last.type == 'comment' && !last.block) {
                        result += '\n'
                        result += indent.repeat(depth)
                    }
                    result += ','
                }
                last = formatComments(compact, betweenValues, firstItem && compact)
                if (!compact || (last && last.type == 'comment' && !last.block)) {
                    result += '\n'
                    result += indent.repeat(depth)
                }
                if (compact && (!firstItem || !last || (last && last.type == 'comment'))) {
                    result += ' '
                }

                betweenValues = []
                path.replace(`${child.key.value}`)

                formatValue(compact, child.key)

                last = formatComments(compact, child.afterKey)

                result += ': '

                last = formatComments(compact, child.beforeValue, true)
                if (last && last.type === 'comment') {
                    result += ' '
                }

                formatValue(compact, child.value)

                last = formatComments(compact, child.afterValue)

                firstItem = false
            }
        }
        last = formatComments(compact, betweenValues) ?? last
        if (!compact) {
            depth--
        }
        if (compact && !firstItem) {
            result += ' '
        }
        if ((last || !firstItem) && (!compact || (last && last.type == 'comment' && !last.block))) {
            result += '\n'
            result += indent.repeat(depth)
        }
        path.pop()
        result += "}"
    }

    function formatArray(compact: boolean, node: ArrayNode) {
        compact = compact || matchAny(path.data, arrayCompact)
        const values = getJsPath<JsonArray>(jsValue, path.data)
        if(values && Array.isArray(values)) {
            if(values.some(v => typeof v === 'string' && [';', '='].some(s => v.includes(s)))) {
                compact = false
            }
            if(values.reduce<number>((pv, cv) => typeof cv === 'string' ? pv + cv.length : pv, 0) > 50) {
                compact = false
            }
        }
        result += "["
        path.push('[]')
        if (!compact) {
            depth += 1
        }
        let betweenValues: Array<CommentNode | NewLineNode> = []
        let index = 0
        let firstItem = true
        let last: CommentNode | NewLineNode | undefined = undefined
        for (const child of node.children) {
            if (child.type !== 'item') {
                betweenValues.push(child)
            } else {
                if (!firstItem) {
                    if (last && last.type == 'comment' && !last.block) {
                        result += '\n'
                        result += indent.repeat(depth)
                    }
                    result += ','
                    index++
                }
                last = formatComments(compact, betweenValues, firstItem && compact)
                if (!compact || (last && last.type == 'comment' && !last.block)) {
                    result += '\n'
                    result += indent.repeat(depth)
                }
                if (compact && (!firstItem || (last && last.type == 'comment'))) {
                    result += ' '
                }

                betweenValues = []

                path.replace(index.toString(10))
                formatValue(compact, child.value)

                last = formatComments(compact, child.afterValue)
                firstItem = false
            }
        }
        last = formatComments(compact, betweenValues)
        if (!compact) {
            depth--
        }
        if ((last || !firstItem) && (!compact || (last && last.type == 'comment' && !last.block))) {
            result += '\n'
            result += indent.repeat(depth)
        }
        path.pop()
        result += "]"
    }

    function formatLiteral(node: LiteralNode) {
        result += node.text ?? JSON.stringify(node.value)
    }

    function formatValue(compact: boolean, node: ValueNode) {
        switch (node.type) {
            case 'array': return formatArray(compact, node)
            case 'object': return formatObject(compact, node)
            case 'literal': return formatLiteral(node)
        }
    }

    function formatRoot() {
        const lastBefore = formatComments(false, root.beforeValue)
        if (lastBefore && lastBefore.type !== 'newline') {
            result += ' '
        }
        formatValue(false, root.value)
        const lastAfter = formatComments(false, root.afterValue)
        if (!lastAfter || lastAfter.type !== 'newline') {
            result += '\n'
        }
    }

    formatRoot()
    return result
}

function sanityCheck(oldJson: string, newJson: string) {
    const oldClean = JSON.stringify(parse(oldJson))
    const newClean = JSON.stringify(parse(newJson))
    if (oldClean !== newClean) {
        throw new Error("Old and new JSON values differ")
    }
}

function formatJsonString(data: string) {
    return formatTree(parseTree(data), '    ', parse(data))
}

async function formatJsonFile(filePath: string): Promise<void> {
    try {
        const content = await fs.readFile(filePath, "utf8")
        const formatted = formatJsonString(content)

        sanityCheck(content, formatted)

        await fs.writeFile(filePath, formatted, 'utf8')
    } catch (e) {
        console.log(`Could not format '${filePath}': ${(e as Error).message}`)
    }
}

const formatFiles = /\.json$/; // Format all json files
const skipDirs = /^\.|^node_modules$/; // Skip dot folders and node_modules

export async function formatFolder(folderPath: string): Promise<void> {
    for await (const ent of walk(folderPath, d => !skipDirs.test(d.name), f => formatFiles.test(f.name))) {
        await formatJsonFile(ent.path)
    }
}
