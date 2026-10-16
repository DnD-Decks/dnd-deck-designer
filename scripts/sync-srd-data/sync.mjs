#!/usr/bin/env node
// SRD correctness scan — reads src/data/*.json and compares against reference/srd/SRD_5.2.1.md
// Run: pnpm scripts:sync-srd-data
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { featureHeadings, parseSpells, parseWeapons, sliceSection } from "./srd.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");
const readJson = (rel) => JSON.parse(readFileSync(path.join(ROOT, rel), "utf8"));

// ── normalise ─────────────────────────────────────────────────────────────────
// castingTime: strip "or Ritual", normalise "Action"→"1 action", collapse reactions
const normCt = (v) => {
  let s = v.replace(/\s*\bor Ritual\b\s*/i, "").trim();
  s = s.replace(/^action$/i, "1 action").replace(/^bonus action$/i, "1 bonus action");
  s = s.replace(/^(1\s+)?reaction[,.]?.*/i, "reaction");
  return s.toLowerCase().replace(/\s+/g, " ").trim();
};
// range: "30 feet" → "30 ft"; strip area notation "(15-ft cone)" etc.
const normRng = (v) =>
  v
    .replace(/(\d+)\s*feet?\b/gi, "$1 ft")
    .replace(/\s*\(.*?\)/g, "")
    .trim()
    .toLowerCase();
// components: strip material detail "(a bell and silver wire)"
const normCmp = (v) =>
  v
    .replace(/\s*\(.*?\)/g, "")
    .trim()
    .toLowerCase();
// duration: strip "Concentration, " prefix (covered by the concentration boolean check)
const normDur = (v) =>
  v
    .replace(/^concentration[,\s]+/i, "")
    .trim()
    .toLowerCase();

// ── findings ──────────────────────────────────────────────────────────────────
const findings = { mismatch: [], missingInSrd: [], missingInOurs: [], unverified: [] };
let matched = 0;

const ok = () => matched++;
const mismatch = (cat, id, field, ours, srd) =>
  findings.mismatch.push({ cat, id, field, ours: String(ours), srd: String(srd) });
const missingInSrd = (cat, id) => findings.missingInSrd.push({ cat, id });
const unverified = (cat, id, note) => findings.unverified.push({ cat, id, note });

// ── SPELLS ────────────────────────────────────────────────────────────────────
console.log("scanning spells…");

// the SRD strips branded spell names — map our PHB names to their SRD equivalents
const SRD_NAME_ALIASES = {
  "tasha's hideous laughter": "hideous laughter",
  "melf's acid arrow": "acid arrow",
  "nystul's magic aura": "arcanist's magic aura",
};
// straighten curly apostrophes to match the srd.mjs key normalisation
const srdKey = (name) => {
  const k = name.toLowerCase().replace(/’/g, "'");
  return SRD_NAME_ALIASES[k] ?? k;
};

// stat blocks corrupted by pdf→md conversion in the vendored SRD; fields verified by hand
const KNOWN_SRD_MD_GAPS = {
  command: "SRD md stat block truncated by page break — fields verified by hand vs pdf",
};

const srdSpells = parseSpells();
const ourSpells = ["spells-level-0", "spells-level-1", "spells-level-2"].flatMap((f) =>
  Object.values(readJson(`src/data/spells/${f}.json`))
);

for (const sp of ourSpells) {
  const s = srdSpells.get(srdKey(sp.name));
  if (!s) {
    missingInSrd("spell", sp.id);
    continue;
  }

  // if SRD parse produced no range AND no duration, flag as parse failure not mismatch
  if (!s.range && !s.duration && sp.range) {
    unverified("spell", sp.id, KNOWN_SRD_MD_GAPS[sp.id] ?? "srd stat-line parse failed");
    continue;
  }

  const checks = [
    ["level", sp.level, s.level],
    ["school", sp.school?.toLowerCase(), s.school.toLowerCase()],
    ["ritual", sp.ritual, s.ritual],
    ["concentration", sp.concentration, s.concentration],
    ["castingTime", normCt(sp.castingTime), normCt(s.castingTime)],
    ["range", normRng(sp.range), normRng(s.range)],
    ["components", normCmp(sp.components), normCmp(s.components)],
    ["duration", normDur(sp.duration), normDur(s.duration)],
  ];
  const bad = checks.filter(([, a, b]) => String(a) !== String(b));
  if (bad.length) for (const [f, o, d] of bad) mismatch("spell", sp.id, f, o, d);
  else ok();
}
const ourSpellNames = new Set(ourSpells.map((s) => srdKey(s.name)));
const srdSpellsL02 = [...srdSpells.values()].filter(
  (s) => s.level <= 2 && !ourSpellNames.has(srdKey(s.name))
);

// ── WEAPONS ───────────────────────────────────────────────────────────────────
console.log("scanning weapons…");
const srdWeapons = parseWeapons();
const ourWeapons = readJson("src/data/gear/weapons.json");

if (!srdWeapons.size) console.warn("⚠ weapon blob parse failed — check SRD heading");

for (const w of ourWeapons) {
  const s = srdWeapons.get(w.name.toLowerCase());
  if (!s) {
    missingInSrd("weapon", w.id);
    continue;
  }
  const bad = [
    ["damage.dice", w.damage.dice, s.dice],
    ["damage.type", w.damage.type.toLowerCase(), s.damageType],
    ["mastery", w.mastery, s.mastery],
  ].filter(([, a, b]) => String(a) !== String(b));
  if (bad.length) for (const [f, o, d] of bad) mismatch("weapon", w.id, f, o, d);
  else ok();
}

// ── CLASS FEATURES ────────────────────────────────────────────────────────────
console.log("scanning class features…");
const classFeatureFiles = [
  ["Barbarian", "src/data/feats/barbarian-feats.json"],
  ["Bard", "src/data/feats/bard-feats.json"],
  ["Cleric", "src/data/feats/cleric-feats.json"],
  ["Druid", "src/data/feats/druid-feats.json"],
  ["Fighter", "src/data/feats/fighter-feats.json"],
  ["Monk", "src/data/feats/monk-feats.json"],
  ["Paladin", "src/data/feats/paladin-feats.json"],
  ["Ranger", "src/data/feats/ranger-feats.json"],
  ["Rogue", "src/data/feats/rogue-feats.json"],
  ["Sorcerer", "src/data/feats/sorcerer-feats.json"],
  ["Warlock", "src/data/feats/warlock-feats.json"],
  ["Wizard", "src/data/feats/wizard-feats.json"],
];
for (const [index, [cls, file]] of classFeatureFiles.entries()) {
  const nextClass = classFeatureFiles[index + 1]?.[0];
  const section = sliceSection(
    `## **${cls}**`,
    nextClass ? `## **${nextClass}**` : "## **Character Origins"
  );
  // straighten curly apostrophes so "Thieves' Cant" matches SRD "Thieves’ Cant"
  const featKey = (name) => name.toLowerCase().replace(/’/g, "'");
  const byName = new Map();
  for (const feature of featureHeadings(section)) {
    const key = featKey(feature.name);
    // Improved versions can repeat a subfeature's name at a higher level.
    byName.set(key, Math.min(byName.get(key) ?? feature.level, feature.level));
  }
  for (const feat of readJson(file)) {
    const srdLvl = byName.get(featKey(feat.name));
    if (srdLvl === undefined) {
      missingInSrd("feature", feat.id);
      continue;
    }
    const ourLvl = Number((feat.source ?? "").match(/Level (\d+)/)?.[1] ?? 0);
    if (ourLvl !== srdLvl) mismatch("feature", feat.id, "level", ourLvl, srdLvl);
    else ok();
  }
}

// ── CLASS RESOURCES ───────────────────────────────────────────────────────────
console.log("scanning class resources…");
const isAlias = (id) => id.startsWith("spell-slot") || id.endsWith("-mana");

for (const [cls, file] of [
  ["Barbarian", "src/data/resources/barbarian-resources.json"],
  ["Bard", "src/data/resources/bard-resources.json"],
  ["Cleric", "src/data/resources/cleric-resources.json"],
  ["Druid", "src/data/resources/druid-resources.json"],
  ["Fighter", "src/data/resources/fighter-resources.json"],
  ["Paladin", "src/data/resources/paladin-resources.json"],
  ["Ranger", "src/data/resources/ranger-resources.json"],
  ["Sorcerer", "src/data/resources/sorcerer-resources.json"],
  ["Warlock", "src/data/resources/warlock-resources.json"],
  ["Wizard", "src/data/resources/wizard-resources.json"],
]) {
  const body = sliceSection(`## **${cls}**`, `## **${cls} Subclass`)
    .join("\n")
    .toLowerCase()
    .replace(/’/g, "'");
  for (const r of readJson(file)) {
    if (isAlias(r.id)) {
      unverified("resource", r.id, `"${r.name}" is our alias for SRD "Spell Slots"`);
      continue;
    }
    if (body.includes(r.name.toLowerCase())) ok();
    else missingInSrd("resource", r.id);
  }
}

// class-resources.json — all 12 classes, name-presence only
const classResources = readJson("src/data/classes/class-resources.json");
for (const [cls, { resources }] of Object.entries(classResources)) {
  const clsName = cls[0].toUpperCase() + cls.slice(1);
  const body = sliceSection(`## **${clsName}**`, `## **${clsName} Subclass`)
    .join("\n")
    .toLowerCase();
  for (const r of resources) {
    if (isAlias(r.id)) {
      unverified("resource", r.id, "spell-slot alias");
      continue;
    }
    if (body.includes(r.name.toLowerCase())) ok();
    else missingInSrd("resource", r.id);
  }
}

// ── REPORT ────────────────────────────────────────────────────────────────────
console.log(
  "\n══════════════════════════════════════\n  SRD CORRECTNESS SCAN\n══════════════════════════════════════\n"
);

if (findings.mismatch.length) {
  console.log("MISMATCHES (our data differs from SRD):");
  for (const { cat, id, field, ours, srd } of findings.mismatch)
    console.log(
      `  ${cat.padEnd(8)} ${id}.${field}\n            ours: ${ours}\n             srd: ${srd}`
    );
  console.log();
}

if (findings.missingInSrd.length) {
  console.log("MISSING IN SRD (our entry not found in SRD — may be a name mismatch):");
  for (const { cat, id } of findings.missingInSrd) console.log(`  ${cat.padEnd(8)} ${id}`);
  console.log();
}

if (findings.unverified.length) {
  console.log("UNVERIFIED (intentional deviations or parse failures):");
  const seen = new Set();
  for (const { cat, id, note } of findings.unverified) {
    const key = `${cat}:${id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    console.log(`  ${cat.padEnd(8)} ${id} — ${note}`);
  }
  console.log();
}

const totalIssues = findings.mismatch.length + findings.missingInSrd.length;
console.log(
  `matched: ${matched}  |  mismatches: ${findings.mismatch.length}  |  missing-in-srd: ${findings.missingInSrd.length}  |  unverified: ${findings.unverified.length}`
);
if (srdSpellsL02.length)
  console.log(
    `\nnote: ${srdSpellsL02.length} SRD spells (levels 0–2) not yet imported into our data`
  );
console.log(
  totalIssues === 0 ? "\n✓ no correctness issues found" : `\n✗ ${totalIssues} issue(s) to review`
);
