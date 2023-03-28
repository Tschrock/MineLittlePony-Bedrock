import path from 'node:path'

import gulp from 'gulp'
import semver from 'semver'

import { Manifest, ManifestDependency, Package, Person } from './interfaces'
import { readJson } from './json'
import { modifyJsonFile } from './json2'

type QuitHandler = () => Promise<void> | void

const quitHandlers = new Set<QuitHandler>()
async function runQuit() {
    setTimeout(() => process.exit(130), 2000)
    for (const h of quitHandlers) try {
        await h()
    } catch (e) { console.error(e) }
}
process.on('SIGINT', () => { runQuit().catch(console.error) })

export function onQuit(handler: () => Promise<void> | void) {
    quitHandlers.add(handler)
}

export async function niceWatch(path: gulp.Globs, task: gulp.TaskFunction) {
    return new Promise(resolve => {
        const watcher = gulp.watch(path, task)
        onQuit(() => resolve(watcher.close()))
    })
}

export function parseVersion(version: string): [number, number, number] | null {
    const parts = semver.parse(version)
    return parts && [parts.major, parts.minor, parts.patch]
}

function personString(person: string | Person): string {
    return typeof person !== 'string' ? person.name : person
}

const packagePath = path.join(__dirname, '..', 'package.json')

let packageData: Package | undefined
export async function getPackage(): Promise<Package> {
    if (packageData) return packageData
    return packageData = await readJson<Package>(packagePath)
}

export async function syncManifest(manifestPath: string) {
    const packageData = await getPackage()
    await modifyJsonFile<Manifest>(manifestPath, manifestData => {
        if (packageData.version) {
            const version = parseVersion(packageData.version)
            if (version) {
                if (manifestData.header) {
                    manifestData.header.version = version
                }
                if (manifestData.modules) {
                    manifestData.modules.forEach(m => m.version = version)
                }
            }
        }
        if (manifestData.header && packageData.engines) {
            const versionString = packageData.engines['mcpe']
            if (versionString) {
                const version = parseVersion(versionString)
                if (version) {
                    manifestData.header.min_engine_version = version
                }
            }
        }
        if (manifestData.metadata) {
            const authors: string[] = []
            if (packageData.author) {
                authors.push(personString(packageData.author))
            }
            if (packageData.contributors) {
                authors.push(...packageData.contributors.map(personString))
            }
            manifestData.metadata.authors = authors
            if (packageData.license) {
                manifestData.metadata.license = packageData.license
            }
            if (packageData.homepage) {
                manifestData.metadata.url = packageData.homepage
            }
        }
    })
}

export async function syncManifestDependencies(manifestPath: string, sources: Array<string | ManifestDependency>) {
    const versions = new Map<string, [number, number, number]>()
    for (const source of sources) {
        if (typeof source === 'string') {
            const manifest = await readJson<Manifest>(source)
            if (manifest.header) versions.set(manifest.header.uuid, manifest.header.version)
        } else {
            versions.set(source.uuid, source.version)
        }
    }
    await modifyJsonFile<Manifest>(manifestPath, manifestData => {
        if (manifestData.dependencies) {
            for (const dependency of manifestData.dependencies) {
                const version = versions.get(dependency.uuid)
                if (version) {
                    dependency.version = version
                }
            }
        }
    })
}
