import actionsData from "../../data/actions/actions.json" with { type: "json" };
import { lookup } from "../../lib/lookup.ts";

import type { CombatAction } from "src/models/actions/combat.model";
import type { CharacterClass, ManualClassification } from "src/models/class/classes.model";

export type ClassAction = CombatAction & {
  classRestriction?: CharacterClass;
  classificationRestriction?: ManualClassification[];
};

const DATA = actionsData.class as ClassAction[];
const TABLE = lookup({ items: DATA, key: "name", label: "class action" });

const allows = ({
  action,
  cls,
  classification,
}: { action: ClassAction; cls: CharacterClass; classification: ManualClassification }) =>
  (!action.classRestriction || action.classRestriction === cls) &&
  (!action.classificationRestriction || action.classificationRestriction.includes(classification));

export const classActions = {
  get: ({ name }: { name: string }) => TABLE.get(name),
  find: ({ name }: { name: string }) => TABLE.find(name),
  list: TABLE.list,

  findAll({ cls, classification }: { cls: CharacterClass; classification: ManualClassification }) {
    return DATA.filter((action) => allows({ action, cls, classification }));
  },
};
