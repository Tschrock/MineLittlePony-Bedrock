import { toStringUnknown } from "./util";

export abstract class System<T extends ISystem<T>> {

    protected system: T;
    protected currentTick = 0;

    constructor(system: T) {
        this.system = system;
        this.system.initialize = this.initialize.bind(this);
        this.system.update = this.update.bind(this);
        this.system.shutdown = this.shutdown.bind(this);
    }

    protected abstract initialize(): void;

    protected update() {
        this.currentTick++;

        this.checkTimers()
    }

    protected abstract shutdown(): void;

    protected log(...things: unknown[]) {
        for (const thing of things) this.logString(toStringUnknown(thing));
    }

    protected abstract logString(message: string): void;

    private timers: Array<[number, Function]> = [];

    protected setTimeout(fn: Function, ticks: number) {
        this.timers.push([this.currentTick + ticks, fn]);
    }

    private checkTimers() {
        for (const timer of this.timers) {
            if(timer[0] < this.currentTick) {
                this.timers.splice(this.timers.indexOf(timer));
                timer[1]();
            }
        }
    }
}
