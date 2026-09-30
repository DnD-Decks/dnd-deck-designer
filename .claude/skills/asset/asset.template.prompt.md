<!--
Template for the /asset skill — background artwork prompt for any deck card
(spell, class feature, class resource, weapon).

The SCENE, ORIENTATION, and VISUAL STYLE are data-driven. The style block is
loaded from one visual-style-*.md file in this folder, excluding its YAML metadata.

Orientation follows the card kind, never a judgment call (see ARCHITECTURE.md
§ Deck scope): feat cards are landscape, every other kind is portrait.

The SCENE comes FIRST on purpose. Image models weight the opening of a prompt;
with the scene buried under the style block they paint "a generic fantasy
painting" and ignore the subject.

Placeholders (filled by SKILL.md § 2):

  {{name}}        card name, e.g. "Fire Bolt", "Sneak Attack", "Rage", "Cleave"
  {{subtitle}}    one clause saying what the card is — see SKILL.md for the per-kind form
  {{scene}}       2–3 sentences: SUBJECT, ACTION, SETTING, LIGHT — concrete nouns, no rules text
  {{extra_note}}  optional whole line; omit it entirely when the kind has none:
                    spell with damage  → "The visual centers on <type> damage."
                    weapon             → "The weapon deals <type> damage; its mastery is <Mastery>."
  {{orientation}} "vertical" (spell, resource, weapon) or "horizontal" (feat)
  {{visual_style}} complete body of the selected visual-style-*.md file
  {{output}}      the whole OUTPUT block body — pick one:
                    portrait  → Vertical 5:7 portrait aspect ratio — standard trading-card proportions (63 x 88 mm).
                                At least 750 x 1050 px.
                    landscape → Horizontal 7:5 landscape aspect ratio — a trading card turned on its side (88 x 63 mm).
                                At least 1050 x 750 px.
                                Compose across the width: the subject and its action read left to right, with room for atmosphere on both sides.
-->

# DECK BACKGROUND

Create a {{orientation}} fantasy background image for a Dungeons & Dragons card deck.

## SCENE

This is the subject of the image. Every element in the picture must serve it; nothing generic.

**{{name}}** — {{subtitle}}.

{{scene}}
{{extra_note}}

## VISUAL STYLE

{{visual_style}}

## COMPOSITION

The image is independent background artwork.
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

{{output}}
