/// <reference types="minecraft-scripting-types-server" />

import { System } from "../common/common";

class Server extends System<IVanillaServerSystem> {

    constructor() {
        super(server.registerSystem(0, 0));
        this.system.initialize = this.initialize.bind(this);
        this.system.update = this.update.bind(this);
        this.system.shutdown = this.shutdown.bind(this);
    }

    protected initialize() {
        const loggerConfig = this.system.createEventData(SendToMinecraftServer.ScriptLoggerConfig);
        if (loggerConfig) {
            loggerConfig.data.log_errors = true;
            loggerConfig.data.log_information = true;
            loggerConfig.data.log_warnings = true;
            this.system.broadcastEvent(SendToMinecraftServer.ScriptLoggerConfig, loggerConfig);
        }

        this.setTimeout(() => {
            this.testThings();
        }, 200);

    }

    protected update() {
        super.update();
    }

    protected shutdown() {
    }

    private testThings() {
        //this.log(global);
    }

    protected logString(message: string) {
        const chatEvent = this.system.createEventData(SendToMinecraftServer.DisplayChat);
        if (chatEvent) {
            chatEvent.data.message = message;
            this.system.broadcastEvent("minecraft:display_chat_event", chatEvent);
        }
    }

}

new Server();
