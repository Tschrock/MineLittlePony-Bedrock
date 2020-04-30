<div align="center">

# Mine Little Pony - Bedrock Edition

[![Discord Server][discord-badge]][discord-link]
[![License][license-badge]][license-link]
[![Build][build-badge]][build-link]
[![Tests][tests-badge]][tests-link]
[![Release][release-badge]][release-link]

</div>

A Minecraft: Bedrock Edition addon that turns players and mobs into ponies.

https://minelittlepony-mod.com

## Installation

1. Download the latest .McPack files from [the GitHub Releases page][release-link]
2. Follow the official installation instructions from https://minecraft.net/addons

## Current Status

### Pony Forms

| Form        | Model | Animations |
|-------------|:-----:|:----------:|
| Earth Pony  |   ✔️   | Partial    |
| Unicorn     |   ✔️   |            |
| Pegasus     |       |            |
| Batpony     |       |            |
| Changeling  |       |            |

### Technical Misc

| Item             | Status      |
|------------------|:-----------:|
| Ponified armor   |      ✔️      |
| Magic auras      | In Progress |
| Pony hat fixes   |             |
| Unicorn horn     |      ✔️      |
| Magic colors     |      ✔️      |
| Pegasi wings     |             |
| Changeling wings |             |
| Batpony wings    |             |
| Batpony ears     |             |
| Tail length      |             |
| Snuzzle type     |             |
| Model size       |             |
| Pony gear        |             |

### Mobs

| Mobs             | Form                     | Status      |
|------------------|--------------------------|:-----------:|
| Drowned          | Earth Pony               |             |
| Enderman         | Special                  |             |
| Evoker           | Unicorn                  |             |
| Guardian         | Special                  |             |
| Husk             | Earth Pony               |             |
| Illusioner       | Unicorn                  |             |
| Pillager         | Changeling               |             |
| Skeleton         | Skeleton (Unicorn)       | In Progress |
| Stray            | Skeleton (Earth Pony)    |             |
| Vex              | Breezie                  |             |
| Villager         | Earth Pony               |             |
| Vindicator       | Pegasus                  |             |
| Wandering Trader | Earth Pony               |             |
| Witch            | Earth Pony + Hat         |             |
| Wither Skeleton  | Large Skeleton (Unicorn) |             |
| Zombie           | Earth Pony               |      ✔️      |
| Zombie Pigman    | Earth Pony               |             |
| Zombie Villager  | Earth Pony               |             |

### Known Issues & Limitations

- Trigger pixels are not supported (and will probably never be).
  - An experimental UI is being worked on to allow selecting pony options, but it will only be available for Windows 10 devices.
- Some items like the Turtle Shell helmet and Elytra are positioned incorrectly.
  - There's currently no way for an addon to override their positioning.
- Magic auras are limited to 13 colors.
  - This limitation may be removed in the future.

## Development
We use [Node.js](https://nodejs.org/) to build the different components of the addon and bundle them together.

### Building
To build the project and bundle it into an add-on file:
```bash
npm install
npm run build
```
The bundled add-on files can be found in `./dist/`

### Local install
To install the plugin as a local development pack for testing:
```bash
npm run install-pack
```

### Watching for changes
To watch the project for changes and automatically build and install:
```bash
npm run watch
```

## License
This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

[website-badge]: https://img.shields.io/badge/website-minelittlepony--mod.com-blue
[website-link]: https://minelittlepony-mod.com

[license-badge]: https://img.shields.io/github/license/Tschrock/MineLittlePony-Bedrock
[license-link]: https://github.com/Tschrock/MineLittlePony-Bedrock/blob/master/LICENSE

[release-badge]: https://img.shields.io/github/v/release/Tschrock/MineLittlePony-Bedrock?label=latest%20release
[release-link]: https://github.com/Tschrock/MineLittlePony-Bedrock/releases/latest

[discord-badge]: https://img.shields.io/discord/182490536119107584?color=blueviolet&logo=discord&logoColor=white
[discord-link]: https://discord.gg/HbJSFyu

[build-badge]: https://img.shields.io/github/workflow/status/Tschrock/MineLittlePony-Bedrock/build
[build-link]: https://github.com/Tschrock/MineLittlePony-Bedrock/actions

[tests-badge]: https://img.shields.io/github/workflow/status/Tschrock/MineLittlePony-Bedrock/test?label=tests
[tests-link]: https://github.com/Tschrock/MineLittlePony-Bedrock/actions
