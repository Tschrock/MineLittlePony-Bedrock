import path from 'path';
import { promises as fs } from 'fs';

import del from 'del';
import gulp from 'gulp';
import gulp_zip from 'gulp-zip';
import { getDataLocations } from 'bedrock-dev-lib';

import { versionManifest, getPackage, niceWatch } from './tools/util';

import adbkit, { Client, Device, DeviceClient } from '@devicefarmer/adbkit'
import type Sync from '@devicefarmer/adbkit/dist/src/adb/sync';

const ANDROID_DATA_PATH = "/sdcard/Android/data/com.mojang.minecraftpe/files/games/com.mojang"

let adb: Client | null = null
let _adbDevice: Promise<Device[]> | null = null
if (process.argv.includes("--adb")) {
    adb = adbkit.createClient()
}

function adbDevices(): Promise<Device[]> {
    if (!adb) throw new Error("adb not connected")
    return _adbDevice = _adbDevice ?? adb.listDevices()
}

async function withAdbDevices(fn: (device: DeviceClient) => void | Promise<void>) {
    if (!adb) return
    const devices = await adbDevices()
    for (const d of devices) {
        const device = adb.getDevice(d.id)
        await fn(device)
    }
}

async function adbSyncFile(syncService: Sync, src: string, dest: string) {
    return new Promise((resolve, reject) => {
        const transfer = syncService.pushFile(src, dest)
        transfer.on('error', reject)
        transfer.on('end', resolve)
    })
}

async function adbSyncDirs(device: DeviceClient, syncService: Sync, src: string, dest: string) {
    await device.shell(`mkdir -p '${dest}'`)
    const children = await fs.readdir(src, { withFileTypes: true })
    for (const child of children) {
        if (child.isFile()) {
            await adbSyncFile(syncService, path.join(src, child.name), path.join(dest, child.name))
        } else if (child.isDirectory()) {
            await adbSyncDirs(device, syncService, path.join(src, child.name), path.join(dest, child.name))
        }
    }
}

/**
 * Cleans the build directory
 */
export function clean() {
    return del('./dist/build');
}
clean.description = 'Cleans the build directory';


/**
 * Builds the addon
 */
export function build() {
    return gulp.src(['./resource-pack/**/*'], { since: gulp.lastRun(build) })
        .pipe(gulp.dest('./dist/build/resource-pack/'))
}
build.description = "Builds the addon"


/**
 * Syncs the addon manifest with the project's package.json
 */
export async function manifest() {
    const packageJson = await getPackage()
    await versionManifest('./resource-pack/manifest.json', packageJson.version);
}
manifest.description = `Syncs the addon manifest with the project's package.json`;

/**
 * Packs the addon into a sharable addon file
 */
export async function pack() {
    const packageJson = await getPackage();
    const filename = `${packageJson.name}-v${packageJson.version}.mcpack`;

    return gulp.src('./dist/build/resource-pack/**/*')
        .pipe(gulp_zip(filename))
        .pipe(gulp.dest('./dist'))
}
pack.description = "Packs the addon into a sharable addon file"

/**
 * Syncs the addon to the game
 */
export async function sync() {
    const packageJson = await getPackage()
    if (adb) {
        const packPath = path.join(ANDROID_DATA_PATH, 'development_resource_packs', packageJson.name)
        return withAdbDevices(async device => {
            await device.shell(`rm -rf '${packPath}'`)
            const syncService = await device.syncService()
            await adbSyncDirs(device, syncService, './dist/build/resource-pack', packPath)
            syncService.end()
        })
    } else {
        const dirs = await getDataLocations();
        for (const dir of dirs) {
            const packsPath = path.join(dir, 'development_resource_packs');
            const installPath = path.join(packsPath, packageJson.name);
            await del(installPath, { cwd: packsPath }).catch(e => console.log(e));
            await new Promise<void>((resolve, reject) => {
                gulp.src('./dist/build/resource-pack/**/*')
                    .on("end", () => resolve())
                    .on("error", err => reject(err))
                    .pipe(gulp.dest(installPath));
            });
        }
    }
}
sync.description = "Syncs the addon to the game"

/**
 * Launches the game
 */
export async function launch() {
    if (adb) {
        return withAdbDevices(async device => {
            await device.startActivity({ action: "android.intent.action.VIEW", data: 'minecraft://' })
        })
    } else {
        // TODO: launch game
    }
}
launch.description = "Launches the game"

/**
 * Outputs the content log
 */
export async function log() {
    // TODO: tail content log
}
log.description = "Outputs the content log"

/**
 * Watches the addon source for changes
 */
export async function watch() {
    return niceWatch('./resource-pack/**/*', gulp.series(build, sync))
}
watch.description = "Watches the addon source for changes"

/**
 * Runs a full development environment
 */
export const dev = gulp.series(clean, manifest, build, sync, launch, log, watch)
dev.description = "Runs a full development environment"
