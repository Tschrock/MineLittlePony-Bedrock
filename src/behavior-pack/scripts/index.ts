import { world } from "@minecraft/server"

world.events.playerSpawn.subscribe(event => {
    event.player.dimension.runCommandAsync(`say Welcome ${event.player.name}!` )
})
