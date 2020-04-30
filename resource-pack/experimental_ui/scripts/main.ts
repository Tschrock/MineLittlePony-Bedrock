

import { LiveReload, getDefaultFiles } from "./LiveReload";
import { getDescriptorLogString2 } from "./util";
import { Console } from "./Console";
declare const engine: any;

new LiveReload(getDefaultFiles()).start();
new Console(
    document.getElementById("console-input") as HTMLInputElement,
    document.getElementById("console-output") as HTMLDivElement
);

import './polyfill';

if("engine" in global) {

    // Get a handle to the scripting interface on creation.
    // The script interface can trigger events to the client script
    let scriptEngineHandle: unknown = null;
    engine.on("facet:updated:core.scripting", (scriptEngine: unknown) => {
        scriptEngineHandle = scriptEngine;
        console.log(scriptEngineHandle);
        console.log((scriptEngineHandle as any).triggerEvent("TestEvent"));
    });
    engine.trigger("facet:request", ["core.scripting"]);

    const refreshBtn = document.getElementById("btn-refresh");
    if(refreshBtn) {
        refreshBtn.addEventListener('click', () => (scriptEngineHandle as any).triggerEvent("CLOSE_SETTINGS"));
    }
}




/**
 * Fixes broken styles when an element loses focus or changes attributes
 * @param event The event
 */
function fixStyles({ target }: Event) {
    if (target instanceof HTMLElement) target.parentNode?.replaceChild(target, target);
}

// Fix styles when an input element looses focus
Array.from(document.querySelectorAll("input")).forEach(e => e.addEventListener("blur", fixStyles, false));

function handleCheckboxClick(event: Event) {
    try {
        const target = event.target;
        if (target instanceof HTMLInputElement) {
            target.checked = !target.checked;
            console.log("-----")
            console.log(getDescriptorLogString2(target));
            fixStyles(event);
        }
    }
    catch (e) {
        console.log(e)
    }

}
Array.from(document.querySelectorAll("input[type=checkbox]")).forEach(e => e.addEventListener("click", handleCheckboxClick, false));

