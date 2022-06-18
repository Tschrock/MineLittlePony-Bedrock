import { promises as fs } from 'node:fs'
import path from 'node:path'

import gulp from 'gulp'
import jsonc from 'jsonc-parser'
import semver from 'semver'

import { Manifest, Package, Person } from './interfaces'

type QuitHandler = () => Promise<void> | void

const quitHandlers = new Set<QuitHandler>()
process.on('SIGINT', async () => {
    setTimeout(() => process.exit(130), 2000)
    for (const h of quitHandlers) await h()
})

export function onQuit(handler: () => Promise<void> | void) {
    quitHandlers.add(handler)
}

export async function niceWatch(path: gulp.Globs, task: gulp.TaskFunction) {
    return new Promise(resolve => {
        const watcher = gulp.watch(path, task)
        onQuit(() => resolve(watcher.close()))
    })
}

function getParseErrorMessage({ error, offset, length }: jsonc.ParseError): string {
    return `JSON parse error: ${jsonc.printParseErrorCode(error)} Offset: ${offset} Length: ${length}`
}

export async function readJsonFile<T>(path: string): Promise<T> {
    const content = await fs.readFile(path, { encoding: 'utf8' })
    const errors: jsonc.ParseError[] = []
    const data: T = jsonc.parse(content, errors)
    if (errors) throw new Error(errors.map(getParseErrorMessage).join("\n"))
    return data
}

export async function writeJsonFile<T>(path: string, data: T): Promise<void> {
    const content = JSON.stringify(data)
    await fs.writeFile(path, content, { encoding: 'utf8' })
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
    if(packageData) return packageData
    return packageData = await readJsonFile<Package>(packagePath)
}

export async function syncManifest(manifestPath: string) {
    const packageData = await getPackage()
    const manifestData = await readJsonFile<Manifest>(manifestPath)
    const version = parseVersion(packageData.version)
    if (version) {
        if (manifestData.header) {
            manifestData.header.version = version
        }
        if (manifestData.modules) {
            manifestData.modules.forEach(m => m.version = version)
        }
    }
    if(manifestData.metadata) {
        const authors: string[] = []
        if(packageData.author) {
            authors.push(personString(packageData.author))
        }
        if(packageData.contributors) {
            authors.push(...packageData.contributors.map(personString))
        }
        manifestData.metadata.authors = authors
        if(packageData.license) {
            manifestData.metadata.license = packageData.license
        }
        if(packageData.homepage) {
            manifestData.metadata.url = packageData.homepage
        }
    }
    await writeJsonFile(manifestPath, manifestData)
}
