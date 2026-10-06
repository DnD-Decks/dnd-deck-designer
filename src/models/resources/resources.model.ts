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

import type { ActionTiming } from "src/models/actions/combat.model";
import type { CharacterClass } from "src/models/class/classes.model";
import type { RestType } from "src/models/rest/rest-actions.model";

export type Resource = {
  id: string;
  name: string;
  uses: number;
  /** one card per use in a character deck; pools like Lay on Hands stay a single card */
  stack?: boolean;
  /** what a pool holds, shown on the face: `5 × Paladin level` */
  pool?: string;
  recharge: RestType;
  /** uses a short rest brings back; omitted, all of them for `short-rest`, none for `long-rest` */
  shortRest?: number;
  action?: ActionTiming;
  description: string;
  icon?: string;
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

export const resources = {
  findAll({ cls }: { cls: CharacterClass }): Resource[] {
    return CLASS_DATA[cls] ?? [];
  },
};
