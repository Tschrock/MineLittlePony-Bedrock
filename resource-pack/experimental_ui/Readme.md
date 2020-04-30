UI Readme
=========

The UI engine has a number of quirks, this file tries to document some of them

## Terms
 - `ui-pixel` - The default Minecraft UI is pixelated, and the size of that "pixel" scales with the device's pixel density and window size. Not everything is aligned to these pixels, but most major UI elements use them. This document will refer to these as ui-pixels.

## Project Guidelines

### UI Sprites
 - Button sprites should be 16x32 ui-pixels scaled at 4x (so a real resolution of 64x128 pixels)
 - Panel sprites should be 32x32 ui-pixels scaled at 4x (so a real resolution of 128x128 pixels)

## Quirks

### Document/Body
 - The top of the screen gets cut off by about 4 pixels

### Fonts
 - Fonts act a bit weird. Some elements will inherit the font-family of their parent, while others like buttons do not. Also, there doesn't seem to be a fallback font (or it's not working on my system) because anything without a font-family (or set to an invalid font-family) does not render text.

### Border Images
 - The sprite used for the border image must be smaller than the element's rendered size (It must be able to tile itself at least once), otherwise part of the border gets cut off (See https://p.cp3.es/ss1579466973-1216.png vs https://p.cp3.es/ss1579467100-4d96.png)
 - The sprite can't be too small, otherwise it will cause a ton of lag when re-drawing (for ex, when resizing the screen). This lag is caused by excessive tiling and seems to increases exponentially with window size.

### Inputs
 - All `<input>` types show a text input, except for `type="button"` which crashes the game.
 - An input's `background-image` disappears when it looses focus. The easiest way I've found to fix this is to turn it off and back on again. And by that I mean detaching and reattaching the element to the DOM using `element.parentNode?.replaceChild(element, element);`.

### Javascript
 - For some objects `Object.getPrototypeOf()` throws an "Illegal invocation" exception
 - Node lists are not iterable (they don't have a `Symbol.iterator`), which means you can't use the spread operator on them. To turn a node list into an array, use `Array.from(nodeList)` instead of `[...nodeList]`.
 - `<Element>.style.*` properties can not be unset.
 - Using `<Element>.setAttribute()` and related methods does not update styles using attribute selectors. This can be fixed by changing a class or reattaching the element to the DOM.
