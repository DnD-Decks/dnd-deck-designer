import barbarianFeatsData from "../../data/feats/barbarian-feats.json" with { type: "json" };
import bardFeatsData from "../../data/feats/bard-feats.json" with { type: "json" };
import clericFeatsData from "../../data/feats/cleric-feats.json" with { type: "json" };
import druidFeatsData from "../../data/feats/druid-feats.json" with { type: "json" };
import fighterFeatsData from "../../data/feats/fighter-feats.json" with { type: "json" };
import monkFeatsData from "../../data/feats/monk-feats.json" with { type: "json" };
import paladinFeatsData from "../../data/feats/paladin-feats.json" with { type: "json" };
import rangerFeatsData from "../../data/feats/ranger-feats.json" with { type: "json" };
import rogueFeatsData from "../../data/feats/rogue-feats.json" with { type: "json" };
import sorcererFeatsData from "../../data/feats/sorcerer-feats.json" with { type: "json" };
import warlockFeatsData from "../../data/feats/warlock-feats.json" with { type: "json" };
import wizardFeatsData from "../../data/feats/wizard-feats.json" with { type: "json" };

import type { CharacterClass } from "src/models/class/classes.model";
import { classes } from "src/models/class/classes.model";

export type Feat = {
  id: string;
  name: string;
  source: string;
  description: string;
  icon?: string;
};

const CLASS_DATA: Partial<Record<CharacterClass, Feat[]>> = {
  barbarian: barbarianFeatsData as Feat[],
  bard: bardFeatsData as Feat[],
  cleric: clericFeatsData as Feat[],
  druid: druidFeatsData as Feat[],
  monk: monkFeatsData as Feat[],
  paladin: paladinFeatsData as Feat[],
  ranger: rangerFeatsData as Feat[],
  rogue: rogueFeatsData as Feat[],
  sorcerer: sorcererFeatsData as Feat[],
  warlock: warlockFeatsData as Feat[],
  wizard: wizardFeatsData as Feat[],
  fighter: fighterFeatsData as Feat[],
};

export const feats = {
  findAll({ cls }: { cls: CharacterClass }): Feat[] {
    // feats carry no icon of their own; the class badge gives every feat card its identity
    const icon = classes.find({ id: cls })?.icon;
    return (CLASS_DATA[cls] ?? []).map((feat) => ({ ...feat, icon }));
  },
};
