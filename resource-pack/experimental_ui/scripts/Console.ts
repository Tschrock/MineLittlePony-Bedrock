import { getLogString } from "./util";

export class Console {

    private history: string[] = [];
    private historyIndex = -1;

    private fixParen = false;

    constructor(
        private readonly input: HTMLInputElement,
        private readonly output: HTMLDivElement
    ) {
        input.addEventListener('keydown', this.onKeyDown.bind(this));
        input.addEventListener('keyup', this.onKeyUp.bind(this));
        input.addEventListener('keypress', this.onKeyPress.bind(this));
        console.log = this.log.bind(this);
        console.info = this.info.bind(this);
        console.warn = this.warn.bind(this);
        console.error = this.error.bind(this);
        console.clear = this.clear.bind(this);
        window.onerror = this.onError.bind(this);
    }

    private onKeyDown(event: KeyboardEvent) {
        // console.log(`[keydown] altKey: ${event.altKey} charCode: ${event.charCode} ctrlKey: ${event.ctrlKey} keyCode: ${event.keyCode} location: ${event.location} metaKey: ${event.metaKey} repeat: ${event.repeat} shiftKey: ${event.shiftKey} which: ${event.keyCode}`)
        switch (event.keyCode) {
            case 13: this.onEnter(); break;
            case 38: this.onUp(); break;
            case 40: if(!this.fixParen) { this.onDown(); } else { this.fixParen = false; } break;
        }
    }

    private onKeyUp(_: KeyboardEvent) {
        // console.log(`[keyup] altKey: ${event.altKey} charCode: ${event.charCode} ctrlKey: ${event.ctrlKey} keyCode: ${event.keyCode} location: ${event.location} metaKey: ${event.metaKey} repeat: ${event.repeat} shiftKey: ${event.shiftKey} which: ${event.keyCode}`)
    }

    private onKeyPress(event: KeyboardEvent) {
        if(event.charCode === 40) this.fixParen = true;
        // console.log(`[keypress] altKey: ${event.altKey} charCode: ${event.charCode} ctrlKey: ${event.ctrlKey} keyCode: ${event.keyCode} location: ${event.location} metaKey: ${event.metaKey} repeat: ${event.repeat} shiftKey: ${event.shiftKey} which: ${event.keyCode}`)
    }

    private onEnter() {
        this.logMessage(this.input.value, ">");
        try {
            this.logMessage(`${getLogString(eval(this.input.value))}\n`, "<");
        }
        catch (e) {
            this.logMessage(`${e.stack}\n`, "E", "error", `<console>`);
        }
        this.historyIndex = -1;
        this.history.unshift(this.input.value)
        this.input.value = "";
    }

    private onUp() {
        if (this.historyIndex < this.history.length - 1) {
            this.input.value = this.history[++this.historyIndex];
        }
    }

    private onDown() {
        if (this.historyIndex > 0) {
            this.input.value = this.history[--this.historyIndex];
        }
        else if(this.historyIndex === 0){
            this.historyIndex = -1;
            this.input.value = "";
        }
    }

    private onError(event: Event | string, source?: string, lineno?: number, colno?: number, _?: Error) {
        this.logMessage(event as string, "E", "error", `${source}:${lineno}:${colno}`);
    }

    public log(...things: any[]) {
        for(const thing of things) {
            this.logMessage(typeof thing === "string" ? thing : getLogString(thing));
        }
    }

    public error(...things: any[]) {
        for(const thing of things) {
            this.logMessage(typeof thing === "string" ? thing : getLogString(thing), "E", "error");
        }
    }

    public info(...things: any[]) {
        for(const thing of things) {
            this.logMessage(typeof thing === "string" ? thing : getLogString(thing));
        }
    }

    public warn(...things: any[]) {
        for(const thing of things) {
            this.logMessage(typeof thing === "string" ? thing : getLogString(thing), "W", "warning");
        }
    }

    public clear() {
        while(this.output.firstChild) this.output.removeChild(this.output.firstChild);
    }

    private logMessage(message: string, icon: string = "", cssClass?: string, line?: string) {

        const entryEl = document.createElement("div");
        entryEl.classList.add("console-log-entry");
        if(cssClass) entryEl.classList.add(cssClass);

        const iconEl = document.createElement("div");
        iconEl.classList.add("console-log-entry-icon");
        iconEl.appendChild(new Text(icon));
        entryEl.appendChild(iconEl);

        const messageEl = document.createElement("div");
        messageEl.classList.add("console-log-entry-message");
        messageEl.appendChild(new Text(message));
        entryEl.appendChild(messageEl);

        if(line) {
            const lineEl = document.createElement("div");
            lineEl.classList.add("console-log-entry-line");
            lineEl.appendChild(new Text(line));
            entryEl.appendChild(lineEl);
        }

        this.output.appendChild(entryEl);

        setTimeout(() => this.output.scrollTop = this.output.scrollHeight, 10);

    }
}
