import { localFetch } from "./util";

/**
 * Detects changes to UI files and triggers a reload.
 */
export class LiveReload {

    private files: string[];
    private contents = new Map<string, string>();
    private checkInterval: number;
    private timeoutId: NodeJS.Timeout | null = null;
    private checkerFn: () => Promise<void>;

    /**
     * Creates a new LiveReload instance
     * @param files An array of files to check
     * @param checkInterval The number of milliseconds to wait between checks
     */
    constructor(files: string[], checkInterval: number = 1000) {
        this.files = files;
        this.checkInterval = checkInterval;
        this.checkerFn = this.checkFiles.bind(this);
    }

    public start() {
        if(this.timeoutId === null) {
            this.timeoutId = setTimeout(this.checkerFn, 0);
        }
    }

    public stop() {
        if(this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
    }

    private getCachedContent(file: string, newContent: string) {
        let oldContent = this.contents.get(file);
        if(!oldContent) {
            this.contents.set(file, newContent);
            return newContent;
        }
        return oldContent;
    }

    private async checkFiles() {
        for (const file of this.files) {
            try {
                const newContent = await localFetch(file);
                const oldContent = this.getCachedContent(file, newContent);
                if(oldContent != newContent) {
                    setTimeout(() => window.location.reload(), 1000);
                    return;
                }
            }
            catch(e) {
                // Ignore
            }
        }
        this.timeoutId = setTimeout(this.checkerFn, this.checkInterval);
    }
}
