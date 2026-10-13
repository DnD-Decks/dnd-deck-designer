import proficiencyData from "../../data/proficiencies/proficiency-details.json" with {
  type: "json",
};
import { lookup } from "../../lib/lookup.ts";

import type { ProficiencyKey } from "src/models/class/classes.model";

export type ProficiencyDetails = {
  id: ProficiencyKey;
  label: string;
};

// Raw JSON is a superset (includes icon); inject id from key.
type RawProficiency = Omit<ProficiencyDetails, "id">;
const RAW = proficiencyData as Record<ProficiencyKey, RawProficiency>;

const DATA: ProficiencyDetails[] = (Object.keys(RAW) as ProficiencyKey[]).map((id) => ({
  id,
  ...RAW[id],
}));

const TABLE = lookup({ items: DATA, key: "id", label: "proficiency" });

export const proficiencyDetails = {
  get: ({ id }: { id: ProficiencyKey }) => TABLE.get(id),
  find: ({ id }: { id: string }) => TABLE.find(id),
  list: TABLE.list,
};
