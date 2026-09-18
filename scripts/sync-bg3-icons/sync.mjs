#!/usr/bin/env node
// Fetches the curated card iconography from https://bg3.wiki into public/icons/ (flat folder).
// Ported from dnd-statblock-editor's category-walking fetcher, reduced to an explicit pick-list:
// every icon this app renders is named here, once, with the exact wiki `File:` title.
//
//   pnpm scripts:sync-bg3-icons              fetch (idempotent: skips files whose sha1 matches)
//   pnpm scripts:sync-bg3-icons -- --dry-run list what would change, touch nothing
//   pnpm scripts:sync-bg3-icons -- --force   re-download everything
//
// Zero dependencies. Requires Node 20+ (global fetch). Writes public/icons/manifest.json.

import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const API = "https://bg3.wiki/w/api.php";
const USER_AGENT =
  "dnd-deck-designer icon fetcher (https://github.com/manuartero/dnd-deck-designer)";
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const OUT_DIR = join(ROOT, "public", "icons");
const DOWNLOAD_CONCURRENCY = 4;

// ── pick-list ─────────────────────────────────────────────────────────────────
// `file` is the path under public/icons/ (served at /icons/<file>); `title` is the wiki
// File: title. Naming: <kind>-<id>.<ext> where <id> is the app's own id (class id, WeaponId...).

const CLASSES = [
  "barbarian",
  "bard",
  "cleric",
  "druid",
  "fighter",
  "monk",
  "paladin",
  "ranger",
  "rogue",
  "sorcerer",
  "warlock",
  "wizard",
];

const DAMAGE_TYPES = [
  "acid",
  "bludgeoning",
  "cold",
  "fire",
  "force",
  "lightning",
  "necrotic",
  "piercing",
  "poison",
  "psychic",
  "radiant",
  "slashing",
  "thunder",
];

// WeaponId → wiki title stem. Lance, whip, blowgun, musket and pistol have no BG3 icon.
const WEAPONS = {
  battleaxe: "Battleaxes",
  club: "Clubs",
  dagger: "Daggers",
  dart: "Darts",
  flail: "Flails",
  glaive: "Glaives",
  greataxe: "Greataxes",
  greatclub: "Greatclubs",
  greatsword: "Greatswords",
  halberd: "Halberds",
  "hand-crossbow": "Hand Crossbows",
  handaxe: "Handaxes",
  "heavy-crossbow": "Heavy Crossbows",
  javelin: "Javelins",
  "light-crossbow": "Light Crossbows",
  "light-hammer": "Light Hammers",
  longbow: "Longbows",
  longsword: "Longswords",
  mace: "Maces",
  maul: "Mauls",
  morningstar: "Morningstars",
  pike: "Pikes",
  quarterstaff: "Quarterstaves",
  rapier: "Rapiers",
  scimitar: "Scimitars",
  shortbow: "Shortbows",
  shortsword: "Shortswords",
  sickle: "Sickles",
  sling: "Slings",
  spear: "Spears",
  trident: "Tridents",
  "war-pick": "War Picks",
  warhammer: "Warhammers",
};

const title = (t) => (t.startsWith("File:") ? t : `File:${t}`);
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const ICONS = [
  // action economy (spell casting time, resource timing)
  { file: "action.png", title: "Action Icon.png" },
  { file: "bonus-action.png", title: "Bonus Action Icon.png" },
  { file: "reaction.png", title: "Reaction Icon.png" },
  // spell chrome
  { file: "mana.png", title: "Spell Slot Icon.png" },
  { file: "concentration.png", title: "Concentration Icon.png" },
  { file: "ritual.png", title: "Ritual Spell Icon.png" },
  { file: "duration.png", title: "Duration Icons.png" },
  { file: "range.png", title: "Range Icon.png" },
  { file: "melee-range.png", title: "Melee Range Icon.png" },
  { file: "saving-throw.png", title: "Saving Throw Icon.png" },
  { file: "attack-roll.png", title: "Attack Roll Icon.png" },
  { file: "aoe.png", title: "Aoe Icon.png" },
  { file: "healing.png", title: "Healing Icon.png" },
  // dice (BG3 colours dice by damage family; these are the ones the spell card shipped with)
  { file: "d4.png", title: "D4 Healing.png" },
  { file: "d6.png", title: "D6 Physical.png" },
  { file: "d8.png", title: "D8 Physical.png" },
  { file: "d10.png", title: "D10 Physical.png" },
  { file: "d12.png", title: "D12 Poison.png" },
  // damage types
  ...DAMAGE_TYPES.map((t) => ({ file: `damage-${t}.png`, title: `${cap(t)} Damage Icon.png` })),
  // class badges (class selector, feat cards)
  ...CLASSES.map((c) => ({ file: `class-${c}.png`, title: `Class ${cap(c)} Badge Icon.png` })),
  // class resources (resource cards)
  { file: "resource-rage.png", title: "Rage Charges Icons.png" },
  { file: "resource-bardic-inspiration.png", title: "Bardic Inspiration Resource Icon.png" },
  { file: "resource-lay-on-hands.png", title: "Lay on Hands Resource Icon.png" },
  { file: "resource-second-wind.webp", title: "Second Wind Unfaded Icon.webp" },
  { file: "resource-sorcery-points.png", title: "Sorcery Points Icons.png" },
  // D&D 2024 Favored Enemy is "Hunter's Mark, always prepared" — reuse the spell's icon
  { file: "resource-favored-enemy.webp", title: "Hunter's Mark Unfaded Icon.webp" },
  // weapon types (weapon mastery cards)
  ...Object.entries(WEAPONS).map(([id, stem]) => ({
    file: `weapon-${id}.png`,
    title: `${stem} Icon.png`,
  })),
].map((i) => ({ ...i, title: title(i.title) }));

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has("--dry-run");
const FORCE = args.has("--force");

// ── wiki API ──────────────────────────────────────────────────────────────────

async function fetchWithRetry({ url, attempt = 0 }) {
  const res = await fetch(url, { headers: { "user-agent": USER_AGENT } });
  if ((res.status === 429 || res.status >= 500) && attempt < 5) {
    const wait = 1000 * 2 ** attempt;
    console.warn(`  ${res.status} from wiki, retrying in ${wait}ms`);
    await new Promise((r) => setTimeout(r, wait));
    return fetchWithRetry({ url, attempt: attempt + 1 });
  }
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res;
}

async function api(params) {
  const url = new URL(API);
  url.search = new URLSearchParams({ format: "json", formatversion: "2", maxlag: "5", ...params });
  const json = await (await fetchWithRetry({ url })).json();
  if (json.error) throw new Error(`API error ${json.error.code}: ${json.error.info}`);
  return json;
}

/** Resolves url/size/mime/sha1 for a list of File: titles, 50 at a time, keyed by our title. */
async function imageInfo(titles) {
  const byTitle = new Map();
  for (let i = 0; i < titles.length; i += 50) {
    const json = await api({
      action: "query",
      prop: "imageinfo",
      iiprop: "url|size|mime|sha1",
      titles: titles.slice(i, i + 50).join("|"),
    });
    // the wiki may normalise a title ("Ico_x" → "Ico x"); map results back to what we asked for
    const denormalise = new Map((json.query.normalized ?? []).map((n) => [n.to, n.from]));
    for (const page of json.query.pages) {
      const info = page.imageinfo?.[0];
      if (info) byTitle.set(denormalise.get(page.title) ?? page.title, info);
    }
  }
  return byTitle;
}

// ── download ──────────────────────────────────────────────────────────────────

async function localSha1(path) {
  try {
    return createHash("sha1")
      .update(await readFile(path))
      .digest("hex");
  } catch {
    return null;
  }
}

async function download(entry) {
  const dest = join(OUT_DIR, entry.file);
  if (!FORCE && existsSync(dest) && (await localSha1(dest)) === entry.sha1) return "skipped";
  if (DRY_RUN) return "would-download";
  const res = await fetchWithRetry({ url: entry.url });
  const bytes = new Uint8Array(await res.arrayBuffer());
  await mkdir(dirname(dest), { recursive: true });
  await writeFile(dest, bytes);
  return "downloaded";
}

async function runPool({ items, worker, concurrency }) {
  const results = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      while (next < items.length) {
        const i = next++;
        results[i] = await worker(items[i], i);
      }
    })
  );
  return results;
}

// ── main ──────────────────────────────────────────────────────────────────────

async function main() {
  const dupes = ICONS.map((i) => i.file).filter((f, i, all) => all.indexOf(f) !== i);
  if (dupes.length) throw new Error(`duplicate files in pick-list: ${dupes.join(", ")}`);

  console.log(`Resolving ${ICONS.length} wiki files...`);
  const info = await imageInfo(ICONS.map((i) => i.title));
  const icons = [];
  const missing = [];
  for (const e of ICONS) {
    const i = info.get(e.title);
    if (!i) {
      missing.push(e.title);
      continue;
    }
    icons.push({ ...e, url: i.url, width: i.width, height: i.height, bytes: i.size, sha1: i.sha1 });
  }
  for (const t of missing) console.warn(`  not on the wiki: ${t}`);

  console.log(
    `${DRY_RUN ? "Checking" : "Downloading"} ${icons.length} icons into ${relative(ROOT, OUT_DIR)}/ ...`
  );
  const tally = { downloaded: 0, skipped: 0, "would-download": 0, failed: 0 };
  await runPool({
    items: icons,
    worker: async (icon) => {
      try {
        const result = await download(icon);
        tally[result]++;
        if (result !== "skipped") console.log(`  ${result.padEnd(14)} ${icon.file}`);
      } catch (err) {
        tally.failed++;
        console.warn(`  failed ${icon.title}: ${err.message}`);
      }
    },
    concurrency: DOWNLOAD_CONCURRENCY,
  });

  if (!DRY_RUN) {
    const manifest = {
      source: "https://bg3.wiki",
      generatedAt: new Date().toISOString(),
      count: icons.length,
      icons: icons
        .sort((a, b) => a.file.localeCompare(b.file))
        .map(({ file, title, url, width, height, bytes, sha1 }) => ({
          file,
          title: title.replace(/^File:/, ""),
          source: `https://bg3.wiki/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`,
          url,
          width,
          height,
          bytes,
          sha1,
        })),
    };
    await writeFile(join(OUT_DIR, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  }

  const totalBytes = icons.reduce((n, i) => n + i.bytes, 0);
  console.log(
    `Done. ${tally.downloaded} downloaded, ${tally.skipped} already up to date, ` +
      `${tally["would-download"]} pending, ${tally.failed} failed, ${missing.length} not found. ` +
      `${icons.length} icons, ${(totalBytes / 1024).toFixed(0)} KB.`
  );
  if (tally.failed || missing.length) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
