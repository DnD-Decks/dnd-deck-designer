import classDetailsData from "src/data/class/class-details.json";

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

// Raw JSON shape is a superset of ClassDetails (some fields differ per class).
// Cast through unknown; tests verify the fields we actually expose.
const RAW = classDetailsData as unknown as Record<CharacterClass, Omit<ClassDetails, "id">>;

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
