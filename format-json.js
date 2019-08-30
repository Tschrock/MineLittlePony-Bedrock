#!/usr/bin/env node
/*
 * format-json.js
 *
 * Formats all json files in the current directory and below using some
 * specific and obscure rules that I think keeps things readable while
 * being somewhat compact.
 * 
 * This was hastily thrown together because I couldn't find anything else
 * that worked the way I wanted it to - it's probably one of the ugliest
 * things I've written, but hey it works.
 * 
 */

const fs = require("fs");
const path = require("path");
const util = require("util");

const fmt = {
    indent: (depth) => " ".repeat(4 * depth),
    isSimpleValue: (val) => typeof val === 'boolean' || typeof val === 'number' || typeof val === 'string' || (Array.isArray(val) && (val.length === 0 || (val.length === 1 && fmt.isSimpleValue(val[0])))),
    isSimpleObject: (val) => typeof val === 'object' && (Object.getOwnPropertyNames(val).length === 0 || (Object.getOwnPropertyNames(val).length === 1 && fmt.isSimpleValue(val[Object.getOwnPropertyNames(val)[0]]))),
    onObjectStart: (state, object, parent) => {

        const isUniform = parent && Array.isArray(parent) && fmt.isSimpleObject(object);

        if (!state.isUniform) state.isUniform = [];
        state.isUniform.push(isUniform);

        if (Object.getOwnPropertyNames(object).length == 0) {
            return "{";
        }
        else if (isUniform) {
            return "{ ";
        }
        else {
            state.depth++;
            return "{\n";
        }
    },
    onObjectEnd: (state, object) => {

        const isUniform = state.isUniform.pop();

        if (Object.getOwnPropertyNames(object).length == 0) {
            return "}";
        }
        else if (isUniform) {
            return " }";
        }
        else {
            state.depth--;
            return fmt.indent(state.depth) + "}";
        }
    },
    onKeyStart: (state, key) => {
        if (state.isUniform && state.isUniform[state.isUniform.length - 1]) {
            return "";
        }
        else {
            return fmt.indent(state.depth);
        }
    },
    onKeyEnd: (state, key) => ": ",
    onPropertyValueStart: (state, object, key, isLast) => "",
    onPropertyValueEnd: (state, object, key, isLast) => {
        if (state.isUniform && state.isUniform[state.isUniform.length - 1]) {
            return isLast ? "" : ", ";
        }
        else {
            return isLast ? "\n" : ",\n";
        }
    },
    onArrayStart: (state, array) => {

        const isUniform = array.every(x => typeof x === 'boolean')
            || (array.every(x => typeof x === 'number' || (typeof x === 'string' && x.length < 40 && (x.match(/ /g) || []).length < 5 && (x.match(/-/g) || []).length < 2)) && array.reduce((pv, cv, ci, arr) => typeof cv === 'string' ? pv + cv.length : 0, 0) < 80)
            || (array.length == 1 && fmt.isSimpleValue(array[0]));

        if (!state.isUniform) state.isUniform = [];
        state.isUniform.push(isUniform);

        if (array.length == 0) {
            return "[";
        }
        else if (isUniform) {
            return "[ ";
        }
        else {
            state.depth++;
            return "[\n";
        }
    },
    onArrayEnd: (state, array) => {
        const isUniform = state.isUniform.pop();


        if (array.length == 0) {
            return "]";
        }
        else if (isUniform) {
            return " ]";
        }
        else {
            state.depth--;
            return fmt.indent(state.depth) + "]";
        }
    },
    onArrayItemStart: (state, array, index, isLast) => {
        if (state.isUniform && state.isUniform[state.isUniform.length - 1]) {
            return "";
        }
        else {
            return fmt.indent(state.depth);
        }
    },
    onArrayItemEnd: (state, array, index, isLast) => {
        if (state.isUniform && state.isUniform[state.isUniform.length - 1]) {
            return isLast ? "" : ", ";
        }
        else {
            return isLast ? "\n" : ",\n";
        }
    },
};

function makePretty(json) {
    const object = JSON.parse(json);
    const formattedJSON = _makeObjectPrettyRecursive(object) + "\n";
    const beforeJSON = JSON.stringify(object);
    const afterJSON = JSON.stringify(JSON.parse(formattedJSON));
    if (beforeJSON != afterJSON) throw new Error("JSON data changed value!");
    return formattedJSON;
}

function _makeObjectPrettyRecursive(object, state, parent) {
    if (!state) state = { depth: 0 };
    var rtn = "";

    rtn += fmt.onObjectStart(state, object, parent);

    const objectKeys = Object.getOwnPropertyNames(object);
    for (let i = 0; i < objectKeys.length; i++) {

        const key = objectKeys[i];
        const value = object[key];
        const isLast = i === objectKeys.length - 1;

        rtn += fmt.onKeyStart(state, key, parent);
        rtn += JSON.stringify(key);
        rtn += fmt.onKeyEnd(state, key, parent);


        rtn += fmt.onPropertyValueStart(state, object, key, isLast, parent);

        if (Array.isArray(value)) {
            rtn += _makeArrayPrettyRecursive(value, state);
        }
        else if (typeof value === 'object') {
            rtn += _makeObjectPrettyRecursive(value, state);
        }
        else {
            rtn += JSON.stringify(value);
        }

        rtn += fmt.onPropertyValueEnd(state, object, key, isLast, parent);

    }

    rtn += fmt.onObjectEnd(state, object, parent);

    return rtn;
}

function _makeArrayPrettyRecursive(array, state, parent) {
    if (!state) state = { depth: 0 };
    var rtn = "";

    rtn += fmt.onArrayStart(state, array, parent);

    for (let i = 0; i < array.length; i++) {

        const value = array[i];
        const isLast = i === array.length - 1;

        rtn += fmt.onArrayItemStart(state, array, i, isLast, parent);

        if (Array.isArray(value)) {
            rtn += _makeArrayPrettyRecursive(value, state, array);
        }
        else if (typeof value === 'object') {
            rtn += _makeObjectPrettyRecursive(value, state, array);
        }
        else {
            rtn += JSON.stringify(value);
        }

        rtn += fmt.onArrayItemEnd(state, array, i, isLast, parent);

    }

    rtn += fmt.onArrayEnd(state, array, parent);

    return rtn;
}

const readDir = util.promisify(fs.readdir);
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

async function formatFolder(folder) {
    const entries = await readDir(folder, { withFileTypes: true });
    for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith(".")) await formatFolder(path.join(folder, entry.name));
        else if (entry.isFile() && (entry.name.endsWith(".json") || entry.name.endsWith(".material"))) await formatFile(path.join(folder, entry.name));
    }
}

async function formatFile(file) {
    try {
        const content = await readFile(file, "utf8");
        const formatted = makePretty(content);
        await writeFile(file, formatted, 'utf8');
    }
    catch (e) {
        console.log(`Could not format '${file}': ${e.message}`);
        console.error(e);
    }
}


formatFolder(".").then(
    () => console.log("Finished formatting files."),
    error => console.log(error)
);
