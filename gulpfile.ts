import path from 'node:path';
import { promises as fs } from 'node:fs';

import gulp from 'gulp';
import gulp_zip from 'gulp-zip';
import ts from 'gulp-typescript';

import adbkit, { Device, DeviceClient } from '@devicefarmer/adbkit'

import { getDataLocations } from 'bedrock-dev-lib';
import { getPackage, niceWatch, syncManifest, syncManifestDependencies } from './tools/util';
import { formatFolder } from './tools/format-json-v3';
import { SyncClient } from './tools/adb';
import { mergeVanillaBehaviors } from './tools/merge';
import { minifyJson } from './tools/minify-json';

const ANDROID_DATA_PATH = "/sdcard/Android/data/com.mojang.minecraftpe/files/games/com.mojang"

const useAdb = process.argv.includes("--adb")
const adb = useAdb ? adbkit.createClient() : null
const adbDevices = adb ? adb.listDevices() : Promise.resolve<Device[]>([])

async function withAdbDevices(fn: (device: DeviceClient) => void | Promise<void>) {
    if (!adb) return
    for (const d of await adbDevices) {
        await fn(adb.getDevice(d.id))
    }
}

// ================ //
//      Clean       //
// ================ //

/**
 * Cleans the behavior pack build directory
 */
export function clean_behaviors() {
    return fs.rm('./dist/build/behavior-pack', { force: true, recursive: true })
}
clean_behaviors.displayName = "clean:behaviors"
clean_behaviors.description = 'Cleans the behavior pack build directory';

/**
 * Cleans the resource pack build directory
 */
export function clean_resources() {
    return fs.rm('./dist/build/resource-pack', { force: true, recursive: true })
}
clean_resources.displayName = "clean:resources"
clean_resources.description = 'Cleans the resource pack build directory';

/**
 * Cleans the build directory
 */
export function clean() {
    return fs.rm('./dist/build', { force: true, recursive: true })
}
clean.description = 'Cleans the build directory';

// ================ //
//      Build       //
// ================ //

/**
 * Builds the tools scripts
 */
export function build_tools() {
    const tsProject = ts.createProject('tsconfig.json');
    return gulp.src('./tools/**/*.ts')
        .pipe(tsProject())
        .pipe(gulp.dest('./dist/build/tools/'));
}
build_tools.displayName = "build:tools"
build_tools.description = "Builds the dev tools"

/**
 * Copies the behavior pack files
 */
async function copy_behavior_files() {
    return gulp.src(['./src/behavior-pack/**/*', "!**/*.ts", "!**/*.json"], { since: gulp.lastRun(copy_behavior_files) })
        .pipe(gulp.dest('./dist/build/behavior-pack/'))
}

/**
 * Processes the behavior pack json files
 */
async function process_behavior_json() {
    return gulp.src(['./src/behavior-pack/**/*.json'], { since: gulp.lastRun(process_behavior_json) })
        .pipe(await mergeVanillaBehaviors())
        .pipe(minifyJson())
        .pipe(gulp.dest('./dist/build/behavior-pack/'))
}

/**
 * Builds the behavior pack scripts
 */
function build_behavior_scripts() {
    const tsProject = ts.createProject('tsconfig.build.json');
    return gulp.src('./src/behavior-pack/**/*.ts')
        .pipe(tsProject())
        .pipe(gulp.dest('./dist/build/behavior-pack/'));
}

/**
 * Builds the behavior pack
 */
export const build_behaviors = gulp.parallel(copy_behavior_files, process_behavior_json, build_behavior_scripts)
build_behaviors.displayName = "build:behaviors"
build_behaviors.description = "Builds the behavior pack"

/**
 * Copies the resource pack files
 */
function copy_resource_files() {
    return gulp.src(['./src/resource-pack/**/*', '!**/*.json'], { since: gulp.lastRun(copy_resource_files) })
        .pipe(gulp.dest('./dist/build/resource-pack/'))
}
/**
 * Processes the resource pack json files
 */
async function process_resource_json() {
    return gulp.src(['./src/resource-pack/**/*.json'], { since: gulp.lastRun(process_resource_json) })
        .pipe(minifyJson())
        .pipe(gulp.dest('./dist/build/resource-pack/'))
}

/**
 * Builds the resource pack
 */
export const build_resources = gulp.parallel(copy_resource_files, process_resource_json)
build_resources.displayName = "build:resources"
build_resources.description = "Builds the resource pack"

/**
 * Builds the addon
 */
export const build = gulp.parallel(build_behaviors, build_resources, build_tools)
build.description = "Builds the addon"

/**
 * Syncs the behavior pack's manifest with the project's package.json
 */
export async function manifest_behaviors() {
    await syncManifest('./src/behavior-pack/manifest.json')
    await syncManifestDependencies('./src/behavior-pack/manifest.json', ['./src/resource-pack/manifest.json'])
    await syncManifestDependencies('./src/resource-pack/manifest.json', ['./src/behavior-pack/manifest.json'])
}
manifest_behaviors.displayName = "manifest:behaviors"
manifest_behaviors.description = `Syncs the behavior pack's manifest with the project's package.json`;

/**
 * Syncs the resource pack's manifest with the project's package.json
 */
export async function manifest_resources() {
    await syncManifest('./src/resource-pack/manifest.json')
    await syncManifestDependencies('./src/behavior-pack/manifest.json', ['./src/resource-pack/manifest.json'])
    await syncManifestDependencies('./src/resource-pack/manifest.json', ['./src/behavior-pack/manifest.json'])
}
manifest_resources.displayName = "manifest:resources"
manifest_resources.description = `Syncs the resource pack's manifest with the project's package.json`;

/**
 * Syncs the addon manifest with the project's package.json
 */
export const manifest = gulp.series(manifest_behaviors, manifest_resources)
manifest.description = `Syncs the addon manifests with the project's package.json`;

// ================ //
//       Pack       //
// ================ //

/**
 * Packs the behavior pack into an installable .mcpack file
 */
export async function pack_behaviors() {
    const packageJson = await getPackage();
    return zipFiles(
        './dist/build/behavior-pack/**/*',
        `./dist/packed/${packageJson.name}-v${packageJson.version}/`,
        `${packageJson.name}-behaviors-v${packageJson.version}.mcpack`,
    )
}
pack_behaviors.displayName = "pack:behaviors"
pack_behaviors.description = "Packs the behavior pack into an installable .mcpack file"

function zipFiles(src: string, dest: string, filename: string) {
    return gulp.src(src).pipe(gulp_zip(filename)).pipe(gulp.dest(dest))
}

/**
 * Packs the resource pack into an installable .mcpack file
 */
export async function pack_resources() {
    const packageJson = await getPackage();
    return zipFiles(
        './dist/build/resource-pack/**/*',
        `./dist/packed/${packageJson.name}-v${packageJson.version}/`,
        `${packageJson.name}-resources-v${packageJson.version}.mcpack`,
    )
}
pack_resources.displayName = "pack:resources"
pack_resources.description = "Packs the resource pack into an installable .mcpack file"

/**
 * Packs the addon into an installable .mcaddon file
 */
export async function pack_addon() {
    const packageJson = await getPackage();
    return zipFiles(
        `./dist/packed/${packageJson.name}-v${packageJson.version}/**/*.mcpack`,
        `./dist/packed/`,
        `${packageJson.name}-v${packageJson.version}.mcaddon`,
    )
}
pack_addon.displayName = "pack:addon"
pack_addon.description = "Packs the addon into an installable .mcaddon file"

/**
 * Packs the addon into an installable .mcaddon file
 */
export const pack = gulp.series(gulp.parallel(pack_behaviors, pack_resources), pack_addon)
pack.description = "Packs the addon into an installable .mcaddon file"


// ================ //
//       Dev        //
// ================ //

async function syncDevelopmentPack(src: string, dest: string) {
    const packageJson = await getPackage()
    if (adb) {
        const packPath = path.join(ANDROID_DATA_PATH, dest, packageJson.name)
        return withAdbDevices(async device => {
            console.log("Syncing to adb device " + device.serial)
            const client = await SyncClient.init(device)
            await client.sync(src, packPath)
            client.end()
        })
    } else {
        const dirs = await getDataLocations();
        for (const dir of dirs) {
            const packsPath = path.join(dir, dest);
            const installPath = path.join(packsPath, packageJson.name);

            await fs.rm(installPath, { force: true, recursive: true }).catch(e => console.log(e));
            await fs.cp(src, installPath, { force: true, recursive: true })
        }
    }
}

/**
 * Syncs the behavior pack to the game's development folder
 */
export function sync_behaviors() {
    return syncDevelopmentPack(
        './dist/build/behavior-pack',
        'development_behavior_packs'
    )
}
sync_behaviors.displayName = "sync:behaviors"
sync_behaviors.description = "Syncs the behavior pack to the game's development folder"

/**
 * Syncs the resource pack to the game's development folder
 */
export function sync_resources() {
    return syncDevelopmentPack(
        './dist/build/resource-pack',
        'development_resource_packs'
    )
}
sync_resources.displayName = "sync:resources"
sync_resources.description = "Syncs the resource pack to the game's development folder"

/**
 * Syncs the addon to the game's development folder
 */
export const sync = gulp.series(sync_behaviors, sync_resources)
sync.description = "Syncs the addon to the game's development folder"

/**
 * Launches the game
 */
export async function launch() {
    if (adb) {
        return withAdbDevices(async device => {
            await device.startActivity({ action: "android.intent.action.VIEW", data: 'minecraft://' })
        })
    } else {
        switch (process.platform) {
            case 'win32':
                break
            case 'darwin':
                break
            case 'linux':

                break
        }
    }
}
launch.description = "Launches the game"

/**
 * Watches the behavior pack source for changes
 */
export async function watch_behaviors() {
    return niceWatch('./src/behavior-pack/**/*', gulp.series(build_behaviors, sync_behaviors))
}
watch_behaviors.displayName = "watch:behaviors"
watch_behaviors.description = "Watches the behavior pack source for changes"

/**
 * Watches the resource pack source for changes
 */
export async function watch_resources() {
    return niceWatch('./src/resource-pack/**/*', gulp.series(build_resources, sync_resources))
}
watch_resources.displayName = "watch:resources"
watch_resources.description = "Watches the resource pack source for changes"

/**
 * Watches the addon source for changes
 */
export const watch = gulp.parallel(watch_behaviors, watch_resources)
watch.description = "Watches the addon source for changes"

/**
 * Formats the behavior pack files
 */
export function format_behaviors() {
    return formatFolder('./src/behavior-pack')
}
format_behaviors.displayName = "format:behaviors"
format_behaviors.description = "Formats the behavior pack files"

/**
 * Formats the resource pack files
 */
export function format_resources() {
    return formatFolder('./src/resource-pack')
}
format_resources.displayName = "format:resources"
format_resources.description = "Formats the resource pack files"

export const format = gulp.parallel(format_behaviors, format_resources)
format.description = "Formats the addon files"

/**
 * Runs a full development environment
 */
export const dev = gulp.series(clean, manifest, build, sync, launch, watch)
dev.description = "Runs a full development environment"
