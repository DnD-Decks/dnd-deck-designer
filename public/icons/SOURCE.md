# Icon provenance

These icons are fetched from the **Baldur's Gate 3 Wiki** (bg3.wiki) and are
property of **Larian Studios**. They are used here as **temporary placeholder
assets** for local development iteration only.

Do not redistribute or include in any public/production build.

## Regenerating

Every file here is named in the pick-list of `scripts/sync-bg3-icons/sync.mjs`, which resolves
it through the wiki's MediaWiki API and skips files whose sha1 already matches:

```
pnpm scripts:sync-bg3-icons              # fetch what is missing or changed
pnpm scripts:sync-bg3-icons -- --dry-run # report only
```

`manifest.json` records, per file, the wiki title, source page, size and sha1. Do not hand-edit
icons or the manifest: add a `{ file, title }` entry to the script and run it.

Naming: `<kind>-<id>.<ext>` keyed by the app's own ids — `class-wizard.png`, `weapon-longsword.png`
(`WeaponId`), `resource-rage.png`, `damage-fire.png` (`DamageType`); unprefixed files are
spell-card chrome (`action.png`, `mana.png`, `d8.png`…).
