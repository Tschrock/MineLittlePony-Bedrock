import path from 'path';

import del from 'del';
import gulp from 'gulp';
import gulp_zip from 'gulp-zip';
import { getDataLocations } from 'bedrock-dev-lib';

import { versionManifest, getPackageVersion, getPackageName } from './tools/util';

// ============================== //
//             Utils              //
// ============================== //

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
export function clean() {
    return del('./dist/build');
}
clean.description = 'Cleans the build directory';

/**
 * Updates the pack's manifest version to match the project's version
 */
export async function version() {
    await versionManifest('./resource-pack/manifest.json', await getPackageVersion());
}
version.description = `Updates the pack's manifest version to match the project's version`;

/**
 * Copies the resource pack files
 */
export function copy() {
    return gulp.src(['./resource-pack/**/*'], { since: gulp.lastRun(copy) })
        .pipe(gulp.dest('./dist/build/resource-pack/'))
}
copy.description = 'Copies the resource pack files';

/**
 * Packs the built resources into an mcpack file
 */
export async function pack() {

    const filename = `${await getPackageName()}-v${await getPackageVersion()}.mcpack`;

    return gulp.src('./dist/build/resource-pack/**/*')
        .pipe(gulp_zip(filename))
        .pipe(gulp.dest('./dist'))
}
pack.description = 'Packs the built resources into an mcpack file';

/**
 * Watches resource files
 */
export const watch = gulp.series(clean, version, copy, () => {
    return niceWatch(
        './resource-pack/**/*',
        gulp.series(copy, install)
        );
    });
watch.description = 'Watches resource files';


/**
 * Installs resource files
 */
export async function install() {
    const dirs = await getDataLocations();
    for (const dir of dirs) {
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
install.description = 'Installs resource files';

export const build = gulp.series(clean, version, copy, pack);

export default build;
