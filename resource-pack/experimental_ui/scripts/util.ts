
/**
 * Gets the contents of a file stored in the `<resource_pack>/experimental_ui/` directory.
 * @param path The path of the file.
 */
export function localFetch(path: string): Promise<string> {
    return new Promise((resolve, reject) => {
        var req = new XMLHttpRequest();
        req.addEventListener("load", () => resolve(req.responseText));
        req.addEventListener("error", (e) => reject(e));
        req.open("GET", `mod://${path}`);
        req.send();
    });
}

type Primitive = bigint | boolean | Function | number | symbol;

/**
 * Generates a log string for an unknown object
 * @param thing The thing to log
 * @param label An optional label for the thing
 * @param depth The depth of the thing
 * @param seenObjects An array of objects that have already been logged
 */
export function getLogString(thing: any, maxDepth: number = 3, label: string | null = null, depth: number = 0, seenObjects: object[] = []): string {
    const thingType = typeof thing;
    const indent = ' '.repeat(4 * depth);
    const labelStr = label ? `${label}: ` : '';
    try {
        switch (thingType) {
            case 'bigint':
            case 'boolean':
            case 'function':
            case 'number':
            case 'symbol':
                return `${indent}${labelStr}[${thingType}] ${(thing as Primitive).toString().split('\n').map(x => x.trim()).join(' ')}`;
            case 'string':
                return `${indent}${labelStr}[string] ${JSON.stringify(thing)}`;
            case 'object':
                if (thing === null) {
                    return `${indent}${labelStr}[null] null`;
                }
                else if (Array.isArray(thing)) {
                    if (seenObjects.indexOf(thing) !== -1) return `${indent}${labelStr}[array] <ALREADY SEEN>`;
                    seenObjects.push(thing);
                    if (depth >= maxDepth) return `${indent}${labelStr}[array] <MAX DEPTH REACHED>`;
                    const items = thing.map(i => getLogString(i, maxDepth, null, depth + 1, seenObjects));
                    const itemsStr = items.join(",\n");
                    return `${indent}${labelStr}[array] [\n${itemsStr}\n${indent}]`;
                }
                else {
                    if (seenObjects.indexOf(thing) !== -1) return `${indent}${labelStr}[object] <ALREADY SEEN>`;
                    seenObjects.push(thing);
                    if (depth >= maxDepth) return `${indent}${labelStr}[object] <MAX DEPTH REACHED>`;
                    const ownPropertyKeys = Object.getOwnPropertyNames(thing).sort();
                    const ownPropertyLines = [];
                    for (const k of ownPropertyKeys) ownPropertyLines.push(getLogString(thing[k], maxDepth, k, depth + 1, seenObjects));
                    const proto = Object.getPrototypeOf(thing);
                    if (proto && proto !== Object.prototype) {
                        ownPropertyLines.push(getLogString(proto, maxDepth, "__proto__", depth + 1, seenObjects))
                    }
                    return `${indent}${labelStr}[object] {\n${ownPropertyLines.join(",\n")}\n${indent}}`;
                }
            case 'undefined':
                return `${indent}${labelStr}[undefined] undefined`;
            default:
                return `${indent}${labelStr}[unknown type]`;
        }
    }
    catch (e) {
        return `${indent}${labelStr}[Error: ${e.message}]`;
    }
}

/**
 * Generates a log string for an unknown object
 * @param thing The thing to log
 * @param label An optional label for the thing
 * @param depth The depth of the thing
 * @param seenObjects An array of objects that have already been logged
 */
export function getDescriptorLogString(thing: any, label: string | null = null, depth: number = 0): string {
    const indent = ' '.repeat(4 * depth);
    const labelStr = label ? `${label}: ` : '';
    try {
        const descriptors = Object.getOwnPropertyDescriptors(thing);
        const ownPropertyKeys = Object.getOwnPropertyNames(descriptors).sort();
        const ownPropertyLines = [];
        for (const k of ownPropertyKeys) ownPropertyLines.push(getLogString(descriptors[k], depth + 2, k, depth + 1));
        const proto = Object.getPrototypeOf(thing);
        if (proto && proto !== Object.prototype) {
            ownPropertyLines.push(getDescriptorLogString(proto, "__proto__", depth + 1))
        }
        return `${indent}${labelStr}[${thing.constructor.name}] {\n${ownPropertyLines.join(",\n")}\n${indent}}`;
    }
    catch (e) {
        return `${indent}${labelStr}[Error: ${e.message}]`;
    }
}

export function getDescriptorLogString2(object: any) {
    let things: Array<[string, string]> = [];
    things = things.concat(Object.getOwnPropertyNames(Object.getOwnPropertyDescriptors(object)).map(p => ["instance", p]));
    for(let thing = tryGetPrototype(object); thing !== null; thing = tryGetPrototype(thing)) {
        const name = thing.constructor.name;
        things = things.concat(Object.getOwnPropertyNames(Object.getOwnPropertyDescriptors(thing)).map(p => [name, p]));
    }
    things.sort(function (a, b) {
        return (a[1] < b[1] ? -1 : (a[1] > b[1] ? 1 : 0));
    });
    return things.map(x => x.join(".")).join("\n");
}

export function tryGetPrototype(thing: any) {
    try {
        return Object.getPrototypeOf(thing);
    }
    catch (e) {
        return null;
    }
}
