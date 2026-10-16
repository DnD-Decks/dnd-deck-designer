// SRD parse helpers — read reference/srd/SRD_5.2.1.md and extract structured data
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");
const lines = readFileSync(`${ROOT}/reference/srd/SRD_5.2.1.md`, "utf8").split("\n");

/** Lines from exact heading (after trim) until a line containing `toPartial` */
export function sliceSection(fromExact, toPartial) {
  const s = lines.findIndex((l) => l.trim() === fromExact);
  if (s === -1) return [];
  const e = toPartial ? lines.findIndex((l, i) => i > s && l.includes(toPartial)) : lines.length;
  return lines.slice(s, e === -1 ? lines.length : e);
}

/** Extract { level, name } for every "## **Level N: Name**" heading in given lines */
export function featureHeadings(sectionLines) {
  let level;
  return sectionLines.flatMap((l) => {
    const m = l.match(/^## \*\*Level (\d+): (.+?)\*\*/);
    if (m) {
      level = Number(m[1]);
      return [{ level, name: m[2].trim() }];
    }
    // Channel Divinity and Monk's Focus effects are inline subfeatures in the SRD.
    return level === undefined
      ? []
      : [...l.matchAll(/_\*\*([^*]+?)\.\*\*_/g)].map((match) => ({ level, name: match[1].trim() }));
  });
}

/**
 * Parse all SRD spell entries.
 * Returns Map<lowerCaseName, { level, school, castingTime, range, components, duration, ritual, concentration }>
 *
 * SRD quirks handled:
 *  - "_School Cantrip_" order (not "_Level 0 School_")
 *  - Stats split across 2-3 lines (Bless, Heroism, Magic Weapon…)
 *  - Stats with level/school merged onto same line (some cantrips)
 *  - "**Component:**" (singular, no S) in some cantrips
 *  - Page-break artifacts (System Reference / page numbers) mid-stat-block
 */
// The SRD inconsistently uses "Component:" (singular) for some spells.
const STAT_FIELDS = [
  "**Casting Time:**",
  "**Range:**",
  "**Components:**",
  "**Component:**",
  "**Duration:**",
];
const PAGE_ARTIFACT = /^(System Reference Document|$)|^\*\*\d+\*\*\s*$/;

export function parseSpells() {
  const spells = new Map();
  for (let i = 0; i < lines.length; i++) {
    const nm = lines[i].match(/^## \*\*([^*]+)\*\*\s*$/);
    if (!nm) continue;

    // Find level/school within next 8 lines.
    // Formats: "_Level N School_"  or  "_School Cantrip_"
    let meta = null;
    for (let j = i + 1; j < Math.min(i + 8, lines.length); j++) {
      const l = lines[j];
      let level;
      let school;
      let m = l.match(/_Level (\d+) ([A-Z][a-z]+)/);
      if (m) {
        level = Number(m[1]);
        school = m[2];
      } else {
        m = l.match(/_([A-Z][a-z]+) Cantrip/) ?? l.match(/_Cantrip ([A-Z][a-z]+)/);
        if (m) {
          level = 0;
          school = m[1];
        }
      }
      if (school !== undefined) {
        meta = { level, school, at: j };
        break;
      }
    }
    if (!meta) continue;

    // Collect stat-field lines, skipping blanks and page-break artifacts.
    // Stop at the first non-blank, non-artifact line that has no stat field.
    const statLines = [];
    for (let j = meta.at; j < Math.min(meta.at + 20, lines.length); j++) {
      const l = lines[j];
      if (STAT_FIELDS.some((f) => l.includes(f))) {
        statLines.push(l);
      } else if (!PAGE_ARTIFACT.test(l.trim()) && statLines.length > 0) {
        break; // first real prose line after stat fields — done
      }
    }
    if (!statLines.some((l) => l.includes("**Casting Time:**"))) continue;

    const stat = statLines.join(" ");
    // "Components?" matches both "Component:" and "Components:"
    const ct = (stat.match(/\*\*Casting Time:\*\* (.+?) \*\*Range:/) || [])[1]?.trim() ?? "";
    const range = (stat.match(/\*\*Range:\*\* (.+?) \*\*Components?:/) || [])[1]?.trim() ?? "";
    const comps = (stat.match(/\*\*Components?:\*\* (.+?) \*\*Duration:/) || [])[1]?.trim() ?? "";
    const dur = (stat.match(/\*\*Duration:\*\* ([^*]+)/) || [])[1]?.trim() ?? "";

    // straighten curly apostrophes so "Dragon’s Breath" keys as "dragon's breath"
    spells.set(nm[1].trim().toLowerCase().replace(/’/g, "'"), {
      name: nm[1].trim(),
      level: meta.level,
      school: meta.school,
      castingTime: ct,
      range,
      components: comps,
      duration: dur,
      ritual: /\bRitual\b/i.test(ct),
      concentration: /^Concentration/i.test(dur),
    });
  }
  return spells;
}

/**
 * Parse the SRD weapons table (the picture-text data line in the Weapons section).
 * Returns Map<lowerCaseName, { dice, damageType, mastery }>
 */
const MASTERY_RE = /\b(slow|nick|vex|push|sap|topple|cleave|graze)\b/i;

export function parseWeapons() {
  // Find the weapons data line directly — unique to the weapons table.
  const blob =
    lines.find((l) => l.includes("Simple Melee Weapons") && l.includes("Club 1d4")) ?? "";
  if (!blob) return new Map();

  // Split on <br> and merge orphan "Two-Handed" tokens into the previous row
  const rows = [];
  for (const chunk of blob.split(/<br>\s*/)) {
    const t = chunk.trim();
    if (/^Two-Handed$/i.test(t) && rows.length) rows[rows.length - 1] += " Two-Handed";
    else if (t) rows.push(t);
  }

  const weapons = new Map();
  for (const row of rows) {
    const dm = row.match(/(\d+d\d+|\d+)\s+(Piercing|Slashing|Bludgeoning)/i);
    if (!dm) continue;
    const name = row.slice(0, row.indexOf(dm[0])).trim();
    if (!name || name === "Name") continue;
    const after = row.slice(row.indexOf(dm[0]) + dm[0].length);
    const mm = after.match(MASTERY_RE);
    weapons.set(name.toLowerCase(), {
      name,
      dice: dm[1],
      damageType: dm[2].toLowerCase(),
      mastery: mm ? mm[1].toLowerCase() : "",
    });
  }
  return weapons;
}
