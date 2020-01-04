import { LiveReload } from "./LiveReload";
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


let textTest = document.getElementById("textTest") as HTMLTextAreaElement;
function log(thing: any) {
    textTest.value += getLogString(thing) + "\n";
}

let doThing = document.getElementById("doThing") as HTMLDivElement;
doThing.addEventListener("click", () => { window.location.reload(); }, false);


// Set up a live reloader for development
new LiveReload([
    "./pony_options.html",
    "./scripts/main.js",
    "./styles.css"
]).start();
