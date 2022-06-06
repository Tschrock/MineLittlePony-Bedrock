import { promises as fs } from 'fs'
import { parse as parseSemver } from 'semver'
import { parse as parseJson } from 'jsonc-parser'
import gulp from 'gulp'

export async function readJson<T>(path: string): Promise<T> {
    return parseJson(await fs.readFile(path, "utf-8")) as T
}

export async function writeJson<T>(path: string, data: T): Promise<void> {
    return await fs.writeFile(path, JSON.stringify(data, null, 4) + "\n", "utf-8")
}

interface Package {
    name: string
    version: string
}

let packageJson: Package | null = null

export async function getPackage(): Promise<Package> {
    if (packageJson === null) packageJson = await readJson<Package>('./package.json')
    return packageJson
}

interface PackManifest {
    header: { version: [number, number, number] }
    modules: Array<{ version: [number, number, number] }>
}

export async function versionManifest(path: string, version: string | [number, number, number]) {
    // If we were passed a string, parse it with semver
    if (typeof version === 'string') {
        var semver = parseSemver(version)
        if (semver === null) throw new Error(`Invalid version '${version}'`)
        version = [semver.major, semver.minor, semver.patch]
    }

    // Read the manifest
    const manifest = await readJson<PackManifest>(path)

    // Update the version numbers
    manifest.header.version = version
    for (const m of manifest.modules) m.version = version

    // Write the manifest
    await writeJson(path, manifest)
}

/** Array of functions to run on quit. */
const quitHandlers = new Set<() => Promise<void> | void>()

/**
 * Registers a function to be run when the proccess is quit.
 * Usefull for stopping and cleaning up watch tasks/servers.
 * @param handler
 */
function onQuit(handler: () => Promise<void> | void) {
    quitHandlers.add(handler)
}

// On Ctrl-C cleanup and exit
process.on('SIGINT', async () => {
    // Give them 2 seconds before forcibly quiting
    setTimeout(() => process.exit(130), 2000)

    // Notify all handlers
    for (const h of quitHandlers) await h()
})

export async function niceWatch(path: string, task: gulp.TaskFunction) {
    return new Promise((resolve) => {
        const watcher = gulp.watch(path, task)
        onQuit(() => resolve(watcher.close()))
    })
}
