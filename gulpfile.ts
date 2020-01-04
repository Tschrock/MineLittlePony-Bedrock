import path from 'path';

import del from 'del';
import gulp from 'gulp';
import gulp_zip from 'gulp-zip';
import webpackStream from 'webpack-stream';

import webpackConfigBehaviors from './webpack.behaviors.config';
import webpackConfigResources from './webpack.resources.config';
import { versionManifest, getPackageVersion, getPackageName, getMCDataDirectory } from './tools/util';


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

    // Quit
    process.exit(130);

});

async function niceWatch(path: string, task: gulp.TaskFunction) {
    return new Promise((resolve) => {
        const watcher = gulp.watch(path, task);
        onQuit(() => resolve(watcher.close()));
    });
}

// ============================== //
//           Behaviors            //
// ============================== //

/**
 * Cleans the build directory
 */
function cleanBehaviors() {
    return del('./dist/build/behavior-pack');
}

/**
 * Builds the behavior pack script using webpack
 */
function buildBehaviorScripts() {
    return gulp.src([
        './behavior-pack/scripts/client/client.ts',
        './behavior-pack/scripts/server/server.ts'
    ])
        .pipe(webpackStream(webpackConfigBehaviors))
        .on('error', function handleError(this: NodeJS.EventEmitter) {
            this.emit('end'); // Recover from errors
        })
        .pipe(gulp.dest('./dist/build/behavior-pack/'));
}

/**
 * Ensures that the pack's manifest version matches the project's version
 */
async function versionBehaviors() {
    await versionManifest('./behavior-pack/manifest.json', await getPackageVersion());
}

/**
 * Copies the behavior pack files
 */
function copyBehaviorFiles() {
    return gulp.src([
        './behavior-pack/**/*', // Copy all files
        '!./behavior-pack/scripts/**/*', // Ignore scripts (see buildBehaviorScripts)
    ])
        .pipe(gulp.dest('./dist/build/behavior-pack/'))
}

/**
 * Packs the built behaviors into an mcpack file
 */
async function packBehaviors() {
    const filename = `${await getPackageName()}-behaviors-v${await getPackageVersion()}.mcpack`;
    return gulp.src('./dist/build/behavior-pack/**/*')
        .pipe(gulp_zip(filename))
        .pipe(gulp.dest('./dist'))
}

/**
 * Watches behavior files
 */
export function watchBehaviors() {
    return niceWatch(
        './behavior-pack/**/*',
        gulp.series(cleanBehaviors, buildBehaviorScripts, copyBehaviorFiles, installBehaviors)
    );
}

/**
 * Installs behavior files
 */
export async function installBehaviors() {
    const packsPath = path.join(getMCDataDirectory(), 'development_behavior_packs');
    const installName = await getPackageName();
    const installPath = path.join(packsPath, installName);
    await del(installPath, { cwd: packsPath });
    return gulp.src('./dist/build/behavior-pack/**/*').pipe(gulp.dest(installPath));
}

export const behaviors = gulp.series(cleanBehaviors, versionBehaviors, buildBehaviorScripts, copyBehaviorFiles, packBehaviors);

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
 * Builds the resource pack UI scripts using webpack
 */
function buildResourceUIScripts() {
    return gulp.src([
        './resource-pack/experimental_ui/scripts/main.ts'
    ])
        .pipe(webpackStream(webpackConfigResources))
        .on('error', function handleError(this: NodeJS.EventEmitter) {
            this.emit('end'); // Recover from errors
        })
        .pipe(gulp.dest('./dist/build/resource-pack/'));
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
        '!./resource-pack/experimental_ui/scripts/**/*'
    ])
        .pipe(gulp.dest('./dist/build/resource-pack/'))
}

/**
 * Packs the built resources into an mcpack file
 */
async function packResources() {

    const filename = `${await getPackageName()}-resources-v${await getPackageVersion()}.mcpack`;

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
        gulp.series(cleanResources, buildResourceUIScripts, copyResourceFiles, installResources)
    );
}

/**
 * Installs resource files
 */
export async function installResources() {
    const packsPath = path.join(getMCDataDirectory(), 'development_resource_packs');
    const installName = await getPackageName();
    const installPath = path.join(packsPath, installName);
    await del(installPath, { cwd: packsPath });
    return gulp.src('./dist/build/resource-pack/**/*').pipe(gulp.dest(installPath));
}

export const resources = gulp.series(cleanResources, versionResources, buildResourceUIScripts, copyResourceFiles, packResources);

export const build = gulp.parallel(resources, behaviors);

export const watch = gulp.parallel(watchResources, watchBehaviors);

export const install = gulp.parallel(installResources, installBehaviors);

export default build;
