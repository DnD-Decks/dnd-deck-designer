import actionsData from "../../data/actions/actions.json" with { type: "json" };
import { lookup } from "../../lib/lookup.ts";

import type { ManualClassification } from "src/models/class/classes.model";

export type ExplorationCategory = "exploration" | "social";

export type ExplorationAction = {
  name: string;
  category: ExplorationCategory;
  description: string;
  classificationRestriction?: ManualClassification[];
};

const DATA = actionsData.exploration as ExplorationAction[];
const TABLE = lookup({ items: DATA, key: "name", label: "exploration action" });

export const explorationActions = {
  get: ({ name }: { name: string }) => TABLE.get(name),
  find: ({ name }: { name: string }) => TABLE.find(name),
  list: TABLE.list,

  findAll({ classification }: { classification: ManualClassification }) {
    return DATA.filter(
      (a) => !a.classificationRestriction || a.classificationRestriction.includes(classification)
    );
  },
};
