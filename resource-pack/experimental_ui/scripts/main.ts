import { LiveReload, getDefaultFiles } from "./LiveReload";
import { getLogString } from "./util";

declare const engine: any;

// Get a handle to the scripting interface on creation.
// The script interface can trigger events to the client script
let scriptEngineHandle: unknown = null;
engine.on("facet:updated:core.scripting", (scriptEngine: unknown) => {
    scriptEngineHandle = scriptEngine;
    log(scriptEngineHandle);
});
engine.trigger("facet:request", ["core.scripting"]);


let loggerBox = document.getElementById("loggerBox") as HTMLTextAreaElement;
function log(thing: any) {
    loggerBox.value += getLogString(thing) + "\n";
}

let doThing = document.getElementById("doThing") as HTMLDivElement;
doThing.addEventListener("click", () => { window.location.reload(); }, false);

new LiveReload(getDefaultFiles()).start();
