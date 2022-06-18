import path from 'path';

import 'mocha';
import Ajv from 'ajv';
import addFormats from "ajv-formats"

import glob from 'globby';

import { readJsonFile } from '../tools/util';


interface Settings {
    ["json.schemas"]: Array<{
        fileMatch: string[];
        url: string;
    }>;
}

interface Schema {
    $id: string;
    [key: string]: any;
}

async function buildValidator(schemaPath: string, schemaFetcher: (path: string) => Promise<Schema>) {

    // Get the base path so we can resolve `#ref`s
    const baseDir = path.dirname(schemaPath);

    // Load the actual schema
    const schemaJSON = await schemaFetcher(schemaPath);

    // Get the id's base
    const idBase = path.dirname(schemaJSON.$id);

    // Build a loader for `#ref`s
    async function loadRef(url: string): Promise<any> {
        return schemaFetcher(url.replace(idBase, baseDir));
    }

    // Create a new validator
    const ajv = new Ajv({ loadSchema: loadRef });
    addFormats(ajv);

    // Compile and return the validator
    return ajv.compileAsync(schemaJSON);

}

async function validateFiles() {

    // Read the vscode settings json. This way we don't have to repeat ourselves
    // and can ensure we have consistent validation between the editor and tests
    const settingsJSON = await readJsonFile<Settings>('./.vscode/settings.json');

    // For each schema
    for (const schema of settingsJSON["json.schemas"]) {

        const validator = await buildValidator(schema.url, readJsonFile).catch(e => {
            console.error(`Error building validator for '${schema.url}':`);
            console.error(e);
        });

        if(validator) {

            // Find files to validate
            const filesToValidate = await glob(schema.fileMatch, { gitignore: true });

            // Build the test
            for (const file of filesToValidate) {
                const fileData = await readJsonFile(file);
                describe(file, () => {
                    it('should validate', () => {
                        if(!validator(fileData)) {
                            throw new Error("Validation Failed");
                        }
                    });
                });
            }

        }

    }

}

validateFiles().then(() => run(), err => console.log(err));
