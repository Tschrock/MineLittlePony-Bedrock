import path from 'path';

import del from 'del';
import gulp from 'gulp';
import gulp_zip from 'gulp-zip';
import { getDataLocations } from 'bedrock-dev-lib';

import { versionManifest, getPackageVersion, getPackageName } from './tools/util';

// ============================== //
//             Utils              //
// ============================== //

/**
 * Cleans the build directory
 */
export function clean() {
    return del('./dist/build');
}
clean.description = 'Cleans the build directory';

/** Array of functions to run on quit. */
const quitHandlers = new Set<() => Promise<void> | void>();

/**
 * Registers a function to be run when the proccess is quit.
 * Usefull for stopping and cleaning up watch tasks/servers.
 * @param handler
 */
function onQuit(handler: () => Promise<void> | void) {
    quitHandlers.add(handler);
}

// On Ctrl-C cleanup and exit
process.on('SIGINT', async () => {

    // Give them 2 seconds before forcibly quiting
    setTimeout(() => process.exit(130), 2000);

    // Notify all handlers
    for (const h of quitHandlers) await h();

});

async function niceWatch(path: string, task: gulp.TaskFunction) {
    return new Promise((resolve) => {
        const watcher = gulp.watch(path, task);
        onQuit(() => resolve(watcher.close()));
    });
}

// ============================== //
//           Resources            //
// ============================== //

/**
 * Cleans the build directory
 */
function cleanResources() {
    return del('./dist/build/resource-pack');
}

/**
 * Ensures that the pack's manifest version matches the project's version
 */
async function versionResources() {
    await versionManifest('./resource-pack/manifest.json', await getPackageVersion());
}

/**
 * Copies the resource pack files
 */
function copyResourceFiles() {
    return gulp.src([
        './resource-pack/**/*', // Copy all files
        '!./resource-pack/experimental_ui/scripts/**/*',
        '!./resource-pack/experimental_ui/styles/**/*'
    ])
        .pipe(gulp.dest('./dist/build/resource-pack/'))
}

/**
 * Packs the built resources into an mcpack file
 */
async function packResources() {

    const filename = `${await getPackageName()}-v${await getPackageVersion()}.mcpack`;

    return gulp.src('./dist/build/resource-pack/**/*')
        .pipe(gulp_zip(filename))
        .pipe(gulp.dest('./dist'))
}

/**
 * Watches resource files
 */
export function watchResources() {
    return niceWatch(
        './resource-pack/**/*',
        gulp.series(cleanResources, copyResourceFiles, installResources)
    );
}

/**
 * Installs resource files
 */
export async function installResources() {
    const dirs = await getDataLocations();
    for(const dir of dirs) {
        const packsPath = path.join(dir, 'development_resource_packs');
        const installName = await getPackageName();
        const installPath = path.join(packsPath, installName);
        await del(installPath, { cwd: packsPath });
        await new Promise<void>((resolve, reject) => {
            gulp.src('./dist/build/resource-pack/**/*')
            .on("end", () => resolve())
            .on("error", err => reject(err))
            .pipe(gulp.dest(installPath));
        });
    }
}

export const resources = gulp.series(cleanResources, versionResources, copyResourceFiles, packResources);

export const build = gulp.parallel(resources);

export const watch = gulp.parallel(watchResources);

export const install = gulp.parallel(installResources);

export default build;
