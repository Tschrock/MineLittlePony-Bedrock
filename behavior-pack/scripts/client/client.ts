/// <reference types="minecraft-scripting-types-client" />

import { System } from "../common/common";

class Client extends System<IVanillaClientSystem> {

    constructor() {
        super(client.registerSystem(0, 0));
        this.system.initialize = this.initialize.bind(this);
        this.system.update = this.update.bind(this);
        this.system.shutdown = this.shutdown.bind(this);
    }

    protected initialize() {
        this.system.listenForEvent(ReceiveFromMinecraftClient.ClientEnteredWorld, this.OnClientEnteredWorld.bind(this));
        this.system.listenForEvent(ReceiveFromMinecraftClient.UIEvent, this.OnUIEvent.bind(this));

        const loggerConfig = this.system.createEventData(SendToMinecraftClient.ScriptLoggerConfig);
        if (loggerConfig) {
            loggerConfig.data.log_errors = true;
            loggerConfig.data.log_information = true;
            loggerConfig.data.log_warnings = true;
            this.system.broadcastEvent(SendToMinecraftClient.ScriptLoggerConfig, loggerConfig);
        }
    }

    protected update() {
        super.update();
    }

    protected shutdown() {
    }

    private OnClientEnteredWorld(eventData: IEventData<IClientEnteredWorldEventData>) {

        // Client has entered the world, show the starting screen
        let loadEventData = this.system.createEventData(SendToMinecraftClient.LoadUI);
        if (loadEventData) {
            loadEventData.data.path = "pony_options.html";
            loadEventData.data.options = {
                absorbs_input: true,
                always_accepts_input: false,
                force_render_below: false,
                is_showing_menu: true,
                render_game_behind: true,
                render_only_when_topmost: true,
                should_steal_mouse: false
            };
            this.system.broadcastEvent(SendToMinecraftClient.LoadUI, loadEventData);
        }

        this.setTimeout(() => {
            this.log(`New player joined with id ${eventData.data.player.id}`);
        }, 80);

    }

    private OnUIEvent(eventData: IEventData<unknown>) {
        this.log(eventData);
        if(eventData.data === "CLOSE_SETTINGS") {
            let unloadEventData = this.system.createEventData(SendToMinecraftClient.UnloadUI);
            if(unloadEventData) {
                unloadEventData.data.path = "pony_options.html";
                this.system.broadcastEvent(SendToMinecraftClient.UnloadUI, unloadEventData);
            }
        }
    }

    protected logString(message: string) {
        const chatEvent = this.system.createEventData(SendToMinecraftClient.DisplayChat);
        if (chatEvent) {
            chatEvent.data.message = message;
            this.system.broadcastEvent(SendToMinecraftClient.DisplayChat, chatEvent);
        }
    }

}

new Client();
