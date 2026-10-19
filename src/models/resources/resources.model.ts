import barbarianResourcesData from "../../data/resources/barbarian-resources.json" with {
  type: "json",
};
import bardResourcesData from "../../data/resources/bard-resources.json" with { type: "json" };
import clericResourcesData from "../../data/resources/cleric-resources.json" with { type: "json" };
import druidResourcesData from "../../data/resources/druid-resources.json" with { type: "json" };
import fighterResourcesData from "../../data/resources/fighter-resources.json" with {
  type: "json",
};
import paladinResourcesData from "../../data/resources/paladin-resources.json" with {
  type: "json",
};
import rangerResourcesData from "../../data/resources/ranger-resources.json" with { type: "json" };
import sorcererResourcesData from "../../data/resources/sorcerer-resources.json" with {
  type: "json",
};
import warlockResourcesData from "../../data/resources/warlock-resources.json" with {
  type: "json",
};
import wizardResourcesData from "../../data/resources/wizard-resources.json" with { type: "json" };

import type { CharacterClass } from "src/models/class/classes.model";
import type { RestType } from "src/models/rest/rest-actions.model";
import { lookup } from "../../lib/lookup.ts";
import { restActions } from "../rest/rest-actions.model.ts";

/** A token a player spends: one card per copy, each copy coming back on its own rest. */
export type Resource = {
  id: string;
  name: string;
  /** the symbol a class action prints as its cost */
  icon?: string;
  /** a spell slot: the level printed inside the mana gem */
  mana?: number;
  /** Second Wind is `{ "short-rest": 1, "long-rest": 1 }`: one copy a short rest brings back, one only a long rest */
  copies: Partial<Record<RestType, number>>;
};

const CLASS_DATA: Partial<Record<CharacterClass, Resource[]>> = {
  barbarian: barbarianResourcesData as Resource[],
  bard: bardResourcesData as Resource[],
  cleric: clericResourcesData as Resource[],
  druid: druidResourcesData as Resource[],
  paladin: paladinResourcesData as Resource[],
  ranger: rangerResourcesData as Resource[],
  sorcerer: sorcererResourcesData as Resource[],
  warlock: warlockResourcesData as Resource[],
  wizard: wizardResourcesData as Resource[],
  fighter: fighterResourcesData as Resource[],
};

const TABLE = lookup({ items: Object.values(CLASS_DATA).flat(), key: "id", label: "resource" });

// a Second Wind deck lays its short-rest copy before its long-rest one
const RECHARGES: RestType[] = ["short-rest", "long-rest"];

export const resources = {
  findAll({ cls }: { cls: CharacterClass }) {
    return CLASS_DATA[cls] ?? [];
  },

  get: ({ id }: { id: string }) => TABLE.get(id),
  find: ({ id }: { id: string }) => TABLE.find(id),
  list: TABLE.list,

  /** the twin copies of Second Wind read apart: "Second Wind (Short Rest)" */
  tokenName({ resource, recharge }: { resource: Resource; recharge: RestType }) {
    return `${resource.name} (${restActions.get({ id: recharge }).label})`;
  },

  /** the rests this resource has copies for, short rest first */
  recharges(resource: Resource) {
    return RECHARGES.filter((rest) => (resource.copies[rest] ?? 0) > 0);
  },
};
