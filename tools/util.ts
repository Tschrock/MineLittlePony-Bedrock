import fs from 'fs';
import os from 'os';
import path from 'path';

import { parse } from 'semver';

export async function readJson<T>(path: string): Promise<T> {
    return JSON.parse(await fs.promises.readFile(path, "utf-8")) as T;
}

export async function writeJson<T>(path: string, data: T): Promise<void> {
    return await fs.promises.writeFile(path, JSON.stringify(data, null, 4), "utf-8");
}

interface Package {
    name: string;
    version: string;
}

let packageJSON: Package | null = null;

async function getPackageJSON() {
    if (packageJSON === null) packageJSON = await readJson<Package>('./package.json');
    return packageJSON;
}

export async function getPackageVersion() {
    return (await getPackageJSON()).version;
}

export async function getPackageName() {
    return (await getPackageJSON()).name;
}

interface PackManifest {
    header: { version: [number, number, number] };
    modules: Array<{ version: [number, number, number] }>;
}
export async function versionManifest(path: string, version: string | [number, number, number]) {

    // If we were passed a string, parse it with semver
    if (typeof version === 'string') {
        var semver = parse(version);
        if (semver === null) throw new Error(`Invalid version '${version}'`);
        version = [semver.major, semver.minor, semver.patch];
    }

    // Read the manifest
    const manifest = await readJson<PackManifest>(path);

    // Update the version numbers
    manifest.header.version = version;
    for (const m of manifest.modules) m.version = version;

    // Write the manifest
    await writeJson(path, manifest);

}

const platformRoots: { [key: string]: string } = {
    "win32": "AppData/Local/Packages/Microsoft.MinecraftUWP_8wekyb3d8bbwe/LocalState",
    "linux": ".local/share/mcpelauncher",
    "darwin": "Library/Application Support/mcpelauncher",
    "android": "storage/shared/"
}

export function getMCDataDirectory() {
    const platform = os.platform();
    const dataPath = platformRoots[platform];
    if(!dataPath) throw new Error(`Could not determine MC data location. Unknown platform '${platform}'.`);
    return path.join(os.homedir(), dataPath, "games/com.mojang");
}
