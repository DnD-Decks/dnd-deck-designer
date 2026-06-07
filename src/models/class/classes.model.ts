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

export type ClassDetails = {
  id: CharacterClass;
  label: string;
  icon: string;
  hitDie: string;
  saves: string;
  description: string;
  manualClassification: "martial" | "spell-caster" | "versatile";
  proficiencies: {
    "light-armor": boolean;
    "medium-armor": boolean;
    "heavy-armor": boolean;
    shields: boolean;
    "simple-weapons": boolean;
    "martial-weapons": boolean;
    skills: { n: number; options: string[] };
  };
};

// Raw JSON is a superset of ClassDetails; cast through unknown.
// Tests verify the fields we actually expose.
type RawClass = Omit<ClassDetails, "id">;

const RAW: Record<CharacterClass, RawClass> = {
  barbarian: barbarianData as unknown as RawClass,
  bard: bardData as unknown as RawClass,
  cleric: clericData as unknown as RawClass,
  druid: druidData as unknown as RawClass,
  fighter: fighterData as unknown as RawClass,
  monk: monkData as unknown as RawClass,
  paladin: paladinData as unknown as RawClass,
  ranger: rangerData as unknown as RawClass,
  rogue: rogueData as unknown as RawClass,
  sorcerer: sorcererData as unknown as RawClass,
  warlock: warlockData as unknown as RawClass,
  wizard: wizardData as unknown as RawClass,
};

const ALL: ClassDetails[] = (Object.keys(RAW) as CharacterClass[]).map((id) => ({
  id,
  ...RAW[id],
}));
const BY_ID = new Map(ALL.map((c) => [c.id, c]));

export const classes = {
  get({ id }: { id: CharacterClass }): ClassDetails {
    const found = BY_ID.get(id);
    if (!found) throw new Error(`Unknown class: ${id}`);
    return found;
  },

  find({ id }: { id: string }): ClassDetails | undefined {
    return BY_ID.get(id as CharacterClass);
  },

  list(): ClassDetails[] {
    return ALL;
  },
};
