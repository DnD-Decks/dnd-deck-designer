import restActionsData from "../../data/rest/rest-actions.json" with { type: "json" };
import { lookup } from "../../lib/lookup.ts";

export type RestType = "short-rest" | "long-rest";

export type RestAction = {
  id: RestType;
  label: string;
  icon: string;
  description: string;
};

const DATA = restActionsData as RestAction[];

const TABLE = lookup({ items: DATA, key: "id", label: "rest action" });

export const restActions = {
  get: ({ id }: { id: RestType }) => TABLE.get(id),
  find: ({ id }: { id: string }) => TABLE.find(id),
  list: TABLE.list,
};
