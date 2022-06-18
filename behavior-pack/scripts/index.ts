import { world } from "mojang-minecraft"

world.events.playerJoin.subscribe(event => {
    event.player.dimension.runCommand(`say Welcome ${event.player.name}!` )
})
