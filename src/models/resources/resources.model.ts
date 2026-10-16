import barbarianResourcesData from "../../data/resources/barbarian-resources.json" with {
  type: "json",
};
import bardResourcesData from "../../data/resources/bard-resources.json" with { type: "json" };
import clericResourcesData from "../../data/resources/cleric-resources.json" with { type: "json" };
import druidResourcesData from "../../data/resources/druid-resources.json" with { type: "json" };
import fighterResourcesData from "../../data/resources/fighter-resources.json" with {
  type: "json",
};
import monkResourcesData from "../../data/resources/monk-resources.json" with { type: "json" };
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
import type { CharacterLevel } from "src/models/class/progression.model";
import type { RestType } from "src/models/rest/rest-actions.model";
import { progression } from "../class/progression.model.ts";

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
  level?: CharacterLevel;
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
  monk: monkResourcesData as Resource[],
};

export const resources = {
  findAll({ cls, level = 1 }: { cls: CharacterClass; level?: CharacterLevel }): Resource[] {
    const current = progression.get({ cls, level });
    const cards = (CLASS_DATA[cls] ?? [])
      .filter((resource) => (resource.level ?? 1) <= level)
      .map((resource) => {
        const suffix = resource.id.slice(cls.length + 1);
        const uses = current.uses?.[suffix] ?? resource.uses;
        if (suffix !== "mana" || !current.slots) return { ...resource, uses };
        const slotLevel = current.pactLevel ?? 1;
        const count = current.slots[0];
        return {
          ...resource,
          uses: count,
          description: `You have ${count} level-${slotLevel} ${cls === "warlock" ? "Pact Magic " : ""}spell slots. Expend one to cast a prepared spell of level ${slotLevel} or lower. Regain all slots after a ${cls === "warlock" ? "Short or Long" : "Long"} Rest.`,
        };
      });
    const secondLevelSlots = current.slots?.[1] ?? 0;
    if (secondLevelSlots > 0)
      cards.push({
        id: `${cls}-mana-2`,
        name: "Level 2 Mana",
        uses: secondLevelSlots,
        stack: true,
        icon: "/icons/mana.png",
        recharge: "long-rest",
        description: `You have ${secondLevelSlots} level-2 spell slots. Expend one to cast a prepared spell of level 2 or lower, including a lower-level spell at level 2. Regain all slots after a Long Rest.`,
      });
    return cards;
  },
};
