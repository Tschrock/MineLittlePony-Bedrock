import path from 'node:path';
import { Dirent, promises as fs, Stats } from 'node:fs';

import adbkit, { DeviceClient } from '@devicefarmer/adbkit'
import type Sync from '@devicefarmer/adbkit/dist/src/adb/sync'
import { sleep } from './util';

const reverse = <T>(p: Promise<T>) => new Promise((resolve, reject) => { p.then(reject, resolve) })

async function retry<T>(action: () => PromiseLike<T>, maxRetries: number, retryDelay: number): Promise<T> {
    while (true) try {
        return await action()
    } catch (e) {
        if (maxRetries--) await sleep(retryDelay)
        else throw e
    }
}

type Ent = Dirent | Stats

function getFileEntryType(file: Ent) {
    if (file.isDirectory()) return 'Directory'
    if (file.isFile()) return 'File'
    if (file.isSymbolicLink()) return 'Symbolic Link'
    if (file.isBlockDevice()) return 'Block Device'
    if (file.isCharacterDevice()) return 'Character Device'
    if (file.isFIFO()) return 'FIFO'
    if (file.isSocket()) return 'Socket'
    return 'unknown'
}

export class SyncClient {
    private device: DeviceClient
    private syncService: Sync

    private constructor(device: DeviceClient, syncService: Sync) {
        this.device = device
        this.syncService = syncService
        this.syncService = syncService
    }

    public static async init(device: DeviceClient): Promise<SyncClient> {
        return new SyncClient(device, await device.syncService())
    }

    public async sync(src: string, dest: string): Promise<void> {
        await this.syncEnt(
            src, await fs.stat(src),
            dest, await this.syncService.stat(dest).catch(() => undefined)
        )
    }

    public end() {
        this.syncService.end()
    }

    private async syncEnt(src: string, srcEnt: Ent, dest: string, destEnt: Ent | undefined) {
        if (srcEnt.isFile()) {
            // Delete dest if it exists
            if (destEnt) await this.deleteEnt(dest, destEnt)
            // Push file
            await this.pushFile(src, dest)
        } else if (srcEnt.isDirectory()) {
            if (!destEnt) {
                // Create dir
                await this.createDir(dest)
            } else if (destEnt.isFile()) {
                // Delete file and create dir
                await this.deleteFile(dest)
                await this.createDir(dest)
            } else if (!destEnt.isDirectory()) {
                throw new Error(`Unsupported path type "${getFileEntryType(destEnt)}"`)
            }

            // Get directory contents
            const srcChildren = new Map((await fs.readdir(src, { withFileTypes: true })).map(ent => [ent.name, ent]))
            const destChildren = new Map((await this.syncService.readdir(dest)).map(ent => [ent.name, ent]))

            // Delete things from dest that aren't in src
            for (const [name, child] of destChildren) {
                if (!srcChildren.has(name)) await this.deleteEnt(path.join(dest, name), child)
            }

            // Sync children from src to dest
            for (const [name, child] of srcChildren) {
                const srcChildPath = path.join(src, name)
                const destChildPath = path.join(dest, name)
                await this.syncEnt(srcChildPath, child, destChildPath, destChildren.get(name))
            }
        }
        else {
            throw new Error(`Unsupported path type "${getFileEntryType(srcEnt)}"`)
        }
    }

    private async shell(command: string): Promise<Buffer> {
        return await adbkit.util.readAll(await this.device.shell(command))
    }

    private async robustShell(command: string, check: () => Promise<unknown>): Promise<Buffer> {
        return await retry(async () => {
            const result = await this.shell(command)
            await retry(check, 4, 200)
            return result
        }, 4, 400)
    }

    private async deleteEnt(path: string, ent: Ent) {
        if (ent.isFile()) await this.deleteFile(path)
        else if (ent.isDirectory()) await this.deleteDir(path)
        else throw new Error(`Unsupported path type "${getFileEntryType(ent)}"`)
    }

    private async deleteFile(path: string) {
        await this.robustShell(`rm '${path}'`, () => reverse(this.syncService.stat(path)))
    }

    private async deleteDir(path: string) {
        await this.robustShell(`rm -rf '${path}'`, () => reverse(this.syncService.stat(path)))
    }

    private async createDir(path: string) {
        await this.robustShell(`mkdir -p '${path}'`, () => this.syncService.stat(path))
    }

    private async pushFile(sourcePath: string, destPath: string) {
        return new Promise((resolve, reject) => this.syncService
            .pushFile(sourcePath, destPath)
            .on('error', reject)
            .on('end', resolve)
        )
    }
}
