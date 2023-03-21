import { world } from "@minecraft/server"

world.events.playerSpawn.subscribe(event => {
    event.player.dimension.runCommand(`say Welcome ${event.player.name}!` )
})
