<!--
Template for the /asset skill — background artwork prompt for any deck card
(spell, class feature, class resource, weapon-mastery property).

The SCENE block is the only data-driven part. Everything from `## VISUAL STYLE`
down is the shared house style: keep it verbatim on every asset so the whole
deck reads as one set.

The SCENE comes FIRST on purpose. Image models weight the opening of a prompt;
with the scene buried under the style block they paint "a generic fantasy
painting" and ignore the subject.

Style history:
  v1  painterly high-fantasy, low-to-medium detail (fire-bolt.png was made with it).
      Spell-only; scene block sat at the end of the prompt.
  v2  same family, nudged toward silhouette and shadow: less rendered detail,
      simpler uncluttered backgrounds, figures read by outline and rim light.
      Scene moved to the top and written as a concrete subject brief.
      Covers every card kind.

Placeholders (filled by SKILL.md § 2):

  {{name}}        card name, e.g. "Fire Bolt", "Sneak Attack", "Rage", "Cleave"
  {{subtitle}}    one clause saying what the card is — see SKILL.md for the per-kind form
  {{scene}}       2–3 sentences: SUBJECT, ACTION, SETTING, LIGHT — concrete nouns, no rules text
  {{extra_note}}  optional whole line; omit it entirely when the kind has none:
                    spell with damage  → "The visual centers on <type> damage."
                    weapon mastery     → "Weapons that carry this property: <list>."
-->

# DECK BACKGROUND STYLE v2

Create a vertical fantasy illustration intended to be used purely as background artwork for a Dungeons & Dragons card deck.

## SCENE

This is the subject of the image. Every element in the picture must serve it; nothing generic.

**{{name}}** — {{subtitle}}.

{{scene}}
{{extra_note}}

## VISUAL STYLE

Modern high-fantasy tabletop RPG illustration with a traditional painterly feeling.

Expressive, clearly visible brushwork and soft pigment texture.
Atmospheric, evocative and impressionistic, leaning slightly abstract.

Prioritize large shapes, silhouettes, lighting and color masses over fine detail.
The image should read at a glance as a few bold shapes set against light and atmosphere, and the subject of the SCENE must be the first thing the eye lands on.

Low detail.
Forms should dissolve naturally into light, shadow, mist, smoke or atmosphere.
Characters and objects lean toward silhouette: readable through their outline and major shapes, with interior detail kept minimal and often lost in shadow.
Prefer figures in shadow or backlit, defined by rim light or by the light source named in the SCENE rather than by rendered surfaces.

Use broad areas of light and shadow with dramatic but soft atmospheric lighting.
Rich but controlled fantasy colors, avoiding excessive saturation.
Favor one dominant color mood with a single accent glow over many competing hues.
Mostly soft, lost edges; only one or two deliberately sharper focal edges.

The image should suggest rather than describe.
Faces, armor, clothing, architecture and scenery should stay simplified masses with little or no intricate detail.
Backgrounds should be simple, hazy and uncluttered — never a fully rendered environment.

Avoid the polished, hyper-detailed look of digital concept art.
Avoid photorealism, 3D-render aesthetics, glossy surfaces and cinematic photography.
Avoid busy compositions with many small elements.

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

## OUTPUT

Vertical 5:7 portrait aspect ratio — standard trading-card proportions (63 x 88 mm).
At least 750 x 1050 px.
