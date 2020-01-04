
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


const MAX_DEPTH = 3;

type Primitive = bigint | boolean | Function | number | symbol;

/**
 * Generates a log string for an unknown object
 * @param thing The thing to log
 * @param label An optional label for the thing
 * @param depth The depth of the thing
 * @param seenObjects An array of objects that have already been logged
 */
export function getLogString(thing: any, label: string | null = null, depth: number = 0, seenObjects: object[] = []): string {
    const thingType = typeof thing;
    const indent = ' '.repeat(4 * depth);
    const labelStr = label ? `${label}: ` : '';
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
                if (depth >= MAX_DEPTH) return `${indent}${labelStr}[array] <MAX DEPTH REACHED>`;
                const items = thing.map(i => getLogString(i, null, depth + 1, seenObjects));
                const itemsStr = items.join(",\n");
                return `${indent}${labelStr}[array] [\n${itemsStr}\n${indent}]`;
            }
            else {
                if (seenObjects.indexOf(thing) !== -1) return `${indent}${labelStr}[object] <ALREADY SEEN>`;
                seenObjects.push(thing);
                if (depth >= MAX_DEPTH) return `${indent}${labelStr}[object] <MAX DEPTH REACHED>`;
                const ownPropertyKeys = Object.getOwnPropertyNames(thing).sort();
                const ownPropertyLines = [];
                for (const k of ownPropertyKeys) ownPropertyLines.push(getLogString(thing[k], k, depth + 1, seenObjects));
                const proto = Object.getPrototypeOf(thing);
                if (proto && proto !== Object.prototype) {
                    ownPropertyLines.push(getLogString(proto, "__proto__", depth + 1, seenObjects))
                }
                return `${indent}${labelStr}[object] {\n${ownPropertyLines.join(",\n")}\n${indent}}`;
            }
        case 'undefined':
            return `${indent}${labelStr}[undefined] undefined`;
        default:
            return `${indent}${labelStr}[unknown type]`;
    }
}
