export function toStringUnknown(thing: unknown, label?: string | null, depth: number = 0): string {
    const thingType = typeof thing;
    const indent = ' '.repeat(4 * depth);
    const labelStr = label ? `${label}: ` : '';
    switch(thingType) {
        case 'bigint':
        case 'boolean':
        case 'function':
        case 'number':
        case 'symbol':
            return `${indent}${labelStr}[${thingType}] ${thing}`;
        case 'string':
            return `${indent}${labelStr}[string] ${JSON.stringify(thing)}`;
        case 'object':
            if(thing === null) {
                return `${indent}${labelStr}[null] null`;
            }
            else if(Array.isArray(thing)) {
                const items = thing.map(i => toStringUnknown(i, null, depth + 1));
                const itemsStr = items.join(",\n");
                return `${indent}${labelStr}[array] [\n${itemsStr}\n${indent}]`;
            }
            else {
                const ownPropertyKeys = Object.getOwnPropertyNames(thing);
                const ownPropertyLines: string[] = [];
                for (const k of ownPropertyKeys) ownPropertyLines.push(toStringUnknown((thing as any)[k], k, depth + 1));
                const proto = Object.getPrototypeOf(thing);
                if(proto && proto !== Object.prototype) {
                    ownPropertyLines.push(toStringUnknown(proto, "__proto__", depth + 1))
                }
                return `${indent}${labelStr}[object] {\n${ownPropertyLines.join(",\n")}\n${indent}}`;
            }
        case 'undefined':
            return `${indent}${labelStr}[undefined] undefined`;
        default:
            return `${indent}${labelStr}[unknown type]`;
    }
}
