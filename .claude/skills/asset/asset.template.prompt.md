<!--
Template for the /asset skill — background artwork prompt for a spell card.

Everything from `# DECK BACKGROUND STYLE v1` down to `## SCENE` is the shared
house style. Keep it verbatim on every asset so the whole deck reads as one set;
only the SCENE block is data-driven.

Placeholders (filled from src/data/spells/spells-level-*.json):

  {{name}}         spell name, e.g. "Fire Bolt"
  {{school}}       spell school, e.g. "Evocation"
  {{level_label}}  "cantrip" when level is 0, otherwise "level N spell"
  {{description}}  first 1–2 sentences of the spell description
  {{damage_note}}  optional whole line — "The visual centers on <type> damage."
                   Omit the line entirely when the spell has no damage field.
-->

# DECK BACKGROUND STYLE v1

Create a vertical fantasy illustration intended to be used purely as background artwork for a Dungeons & Dragons card deck.

## VISUAL STYLE

Modern high-fantasy tabletop RPG illustration with a traditional painterly feeling.

Expressive, clearly visible brushwork and soft pigment texture.
Atmospheric, evocative and slightly impressionistic.

Prioritize large shapes, silhouettes, lighting and color masses over fine detail.

Low-to-medium detail.
Forms should often dissolve naturally into light, shadow, mist, smoke or atmosphere.
Characters and objects should remain readable primarily through their silhouette and major shapes.

Use broad areas of light and shadow with dramatic but soft atmospheric lighting.
Rich but controlled fantasy colors, avoiding excessive saturation.
Mix soft, lost edges with only a few deliberately sharper focal edges.

The image should suggest detail rather than describe everything precisely.
Faces, armor, clothing, architecture and scenery should NOT contain excessive intricate detail.

Avoid the polished, hyper-detailed look of digital concept art.
Avoid photorealism, 3D-render aesthetics, glossy surfaces and cinematic photography.

## COMPOSITION

The artwork is an independent fantasy illustration.
It must NEVER contain or imply any part of a card design.

No text.
No typography.
No icons.
No symbols representing game mechanics.
No borders.
No frames.
No UI.
No decorative card elements.
No reserved text boxes or artificially empty areas designed for card information.

## SCENE

**{{name}}** — {{school}} {{level_label}}.

{{description}}
{{damage_note}}
