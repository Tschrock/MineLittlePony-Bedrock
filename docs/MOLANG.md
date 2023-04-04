
## Entity Variables

### Is Pony
If the entity is in pony form.
- Type: `boolean`
- Entity Property: `minelp:is_pony`
- Molang Variable: `variable.minelp_is_pony`
- Values:
  - `true`
  - `false`
- Default Value:
  - Mobs: `true`
  - Player: `false`

### Ear Type

The type of ears.

- Type: `enum`
- Entity Property: `minelp:ear_type`
- Molang Variable: `variable.minelp_ear_type`
- Values:
  - `PONY`: Pony ears
  - `BAT`: Bat pony ears
- Default: `PONY`

### Handedness

The pony's primary hand.

- Type: `enum`
- Entity Property: `minelp:handedness`
- Molang Variable: `variable.minelp_handedness`
- Values:
  - `RIGHT`: Right handed
  - `LEFT`: Left handed
- Default: `RIGHT`

### Horn Type

The pony's horn.

- Type: `enum`
- Entity Property: `minelp:horn_type`
- Molang Variable: `variable.minelp_horn_type`
- Values:
  - `NONE`: No horn
  - `UNICORN`: Unicorn horn
- Default: `NONE`

### Magic Color

The pony's magic color, as an RGB integer.

- Type: `integer`
- Entity Property: `minelp:magic_color`
- Molang Variable: `variable.minelp_magic_color`
- Values: `0` to `16777216`
- Default Value: random

### Magic Color (Red Component)

The red component of the pony's magic color, as a float.

- Molang Variable: `variable.minelp_magic_r`
- Value: `0.0` to `1.0`

### Magic Color (Green Component)

The green component of the pony's magic color, as a float.

- Molang Variable: `variable.minelp_magic_g`
- Values: `0.0` to `1.0`

### Magic Color (Blue Component)

The blue component of the pony's magic color, as a float.

- Molang Variable: `variable.minelp_magic_b`
- Values: `0.0` to `1.0`

### Muzzle Type

The type of muzzle.

- Type: `enum`
- Entity Property: `minelp:muzzle_type`
- Molang Variable: `variable.minelp_muzzle_type`
- Values:
  - `NONE`: No muzzle
  - `FEMALE`: Female muzzle
  - `MALE`: Male muzzle
- Default: `FEMALE`

### Tail Length

The length of the pony's tail

- Type: `enum`
- Entity Property: `minelp:tail_length`
- Molang Variable: `variable.minelp_tail_length`
- Values:
  - `STUB`: Stub
  - `SHORT`: 1/4 length
  - `HALF`: Half length
  - `LONG`: 3/4 length
  - `FULL`: Full length
- Default: `FULL`

### Wing Type

The type of wing to show

- Type: `enum`
- Entity Property: `minelp:wing_type`
- Molang Variable: `variable.minelp_wing_type`
- Values:
  - `NONE`: No wings
  - `PEGASUS`: Pegasus wings
  - `BAT`: Bat wings
  - `BUG`: Bug wings
- Default: `NONE`

### Zebra Mane

Shows the zebra mane.

- Type: `boolean`
- Entity Property: `minelp:zebra_mane`
- Molang Variable: `variable.minelp_zebra_mane`
- Values:
  - `false`: No mane
  - `true`: Zebra mane
- Default: `false`
