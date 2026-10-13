import barbarianData from "../../data/classes/barbarian.json" with { type: "json" };
import bardData from "../../data/classes/bard.json" with { type: "json" };
import clericData from "../../data/classes/cleric.json" with { type: "json" };
import druidData from "../../data/classes/druid.json" with { type: "json" };
import fighterData from "../../data/classes/fighter.json" with { type: "json" };
import monkData from "../../data/classes/monk.json" with { type: "json" };
import paladinData from "../../data/classes/paladin.json" with { type: "json" };
import rangerData from "../../data/classes/ranger.json" with { type: "json" };
import rogueData from "../../data/classes/rogue.json" with { type: "json" };
import sorcererData from "../../data/classes/sorcerer.json" with { type: "json" };
import warlockData from "../../data/classes/warlock.json" with { type: "json" };
import wizardData from "../../data/classes/wizard.json" with { type: "json" };
import { lookup } from "../../lib/lookup.ts";

export type ManualClassification = "martial" | "spell-caster" | "versatile";

export type ProficiencyKey =
  | "light-armor"
  | "medium-armor"
  | "heavy-armor"
  | "shields"
  | "simple-weapons"
  | "martial-weapons";

export type CharacterClass =
  | "barbarian"
  | "bard"
  | "cleric"
  | "druid"
  | "fighter"
  | "monk"
  | "paladin"
  | "ranger"
  | "rogue"
  | "sorcerer"
  | "warlock"
  | "wizard";

type HitDie = "d6" | "d8" | "d10" | "d12";

// A proficiency grant may be partial: monk/rogue get martial weapons restricted
// to certain properties (e.g. "martial weapons that have the Light property").
export type ProficiencyGrant = boolean | { property: string[] };

export type ClassDetails = {
  id: CharacterClass;
  label: string;
  icon: string;
  hitDie: HitDie;
  saves: string;
  description: string;
  manualClassification: ManualClassification;
  proficiencies: Record<ProficiencyKey, ProficiencyGrant> & {
    skills: { n: number; options: string[] };
    tools?: string[];
  };
};

// Raw JSON is a superset of ClassDetails with widened string fields; validate
// the union fields once at module init so a typo'd hit die or classification
// fails fast instead of surfacing as broken UI.
type RawClass = Omit<ClassDetails, "id">;

type RawClassInput = Omit<RawClass, "hitDie" | "manualClassification" | "proficiencies"> & {
  hitDie: string;
  manualClassification: string;
  proficiencies: Record<ProficiencyKey, ProficiencyGrant> & {
    skills: { n: number; options: string[] };
    tools?: string[];
  };
};

const HIT_DICE = new Set<string>(["d6", "d8", "d10", "d12"] satisfies HitDie[]);
const CLASSIFICATIONS = new Set<string>([
  "martial",
  "spell-caster",
  "versatile",
] satisfies ManualClassification[]);

function parseClass({ id, data }: { id: CharacterClass; data: RawClassInput }): ClassDetails {
  if (!HIT_DICE.has(data.hitDie)) {
    throw new Error(`Class ${id}: unknown hitDie "${data.hitDie}"`);
  }
  if (!CLASSIFICATIONS.has(data.manualClassification)) {
    throw new Error(`Class ${id}: unknown manualClassification "${data.manualClassification}"`);
  }
  return {
    id,
    ...data,
    hitDie: data.hitDie as HitDie,
    manualClassification: data.manualClassification as ManualClassification,
    proficiencies: data.proficiencies as ClassDetails["proficiencies"],
  };
}

const RAW: Record<CharacterClass, RawClassInput> = {
  barbarian: barbarianData,
  bard: bardData,
  cleric: clericData,
  druid: druidData,
  fighter: fighterData,
  monk: monkData,
  paladin: paladinData,
  ranger: rangerData,
  rogue: rogueData,
  sorcerer: sorcererData,
  warlock: warlockData,
  wizard: wizardData,
};

const ALL = (Object.keys(RAW) as CharacterClass[]).map((id) => parseClass({ id, data: RAW[id] }));
const TABLE = lookup({ items: ALL, key: "id", label: "class" });

export const classes = {
  get: ({ id }: { id: CharacterClass }) => TABLE.get(id),
  find: ({ id }: { id: string }) => TABLE.find(id),
  list: TABLE.list,
};
