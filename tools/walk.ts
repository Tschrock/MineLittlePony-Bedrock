import { Dirent, promises as fs } from 'fs';
import path from 'path';

export type DirentExt = Dirent & { path: string };
export type WalkFilter = (d: DirentExt) => Promise<boolean> | boolean;

/**
 * An async generator that recursively iterates through the files in a directory tree. Does not follow symlinks.
 * @param dir The starting directory.
 * @param dirFilter The directory filter. Return `true` to include the entry, `false` to ignore it.
 * @param fileFilter The file filter. Return `true` to include the entry, `false` to ignore it.
 */
export async function* walk(dir: string, dirFilter: WalkFilter, fileFilter: WalkFilter): AsyncGenerator<DirentExt, void, undefined> {
    for await (const d of await fs.opendir(dir)) {
        const entry = Object.assign(d, { path: path.join(dir, d.name) });
        if (d.isDirectory() && await dirFilter(entry)) {
            yield* walk(entry.path, dirFilter, fileFilter);
        }
        else if (d.isFile() && await fileFilter(entry)) {
            yield entry;
        }
    }
}
