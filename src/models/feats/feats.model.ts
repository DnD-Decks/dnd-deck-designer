import barbarianFeatsData from "../../data/feats/barbarian-feats.json" with { type: "json" };
import bardFeatsData from "../../data/feats/bard-feats.json" with { type: "json" };
import clericFeatsData from "../../data/feats/cleric-feats.json" with { type: "json" };
import druidFeatsData from "../../data/feats/druid-feats.json" with { type: "json" };
import battleMasterFeatsData from "../../data/feats/fighter-battle-master-feats.json" with {
  type: "json",
};
import fighterFeatsData from "../../data/feats/fighter-feats.json" with { type: "json" };
import monkFeatsData from "../../data/feats/monk-feats.json" with { type: "json" };
import paladinFeatsData from "../../data/feats/paladin-feats.json" with { type: "json" };
import rangerFeatsData from "../../data/feats/ranger-feats.json" with { type: "json" };
import rogueFeatsData from "../../data/feats/rogue-feats.json" with { type: "json" };
import sorcererFeatsData from "../../data/feats/sorcerer-feats.json" with { type: "json" };
import warlockFeatsData from "../../data/feats/warlock-feats.json" with { type: "json" };
import wizardFeatsData from "../../data/feats/wizard-feats.json" with { type: "json" };
import { lookup } from "../../lib/lookup.ts";

import type { CharacterClass } from "src/models/class/classes.model";
import type { CharacterLevel, SubclassId } from "src/models/class/progression.model";
import type { Provenance } from "src/models/provenance/provenance.model";
import { classes } from "../class/classes.model.ts";

export type Feat = {
  id: string;
  name: string;
  source: string;
  description: string;
  icon?: string;
  level?: CharacterLevel;
  subclass?: SubclassId;
  choice?: "maneuvers";
  provenance?: Provenance;
  descriptions?: Partial<Record<CharacterLevel, string>>;
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
  fighter: [...fighterFeatsData, ...battleMasterFeatsData] as Feat[],
};

const ALL = classes
  .list()
  .flatMap(({ id }) =>
    (CLASS_DATA[id] ?? []).map((feat) => ({ ...feat, icon: classes.get({ id }).icon }))
  );
const TABLE = lookup({ items: ALL, key: "id", label: "feat" });

export const feats = {
  get: ({ id }: { id: string }) => TABLE.get(id),
  find: ({ id }: { id: string }) => TABLE.find(id),
  findAll({
    cls,
    level = 1,
    subclass = "champion",
  }: { cls: CharacterClass; level?: CharacterLevel; subclass?: SubclassId }): Feat[] {
    // feats carry no icon of their own; the class badge gives every feat card its identity
    const icon = classes.find({ id: cls })?.icon;
    return (CLASS_DATA[cls] ?? [])
      .filter((feat) => (feat.level ?? 1) <= level)
      .filter((feat) => !feat.subclass || feat.subclass === subclass)
      .map((feat) => ({
        ...feat,
        icon,
        description: feat.descriptions?.[level] ?? feat.description,
      }));
  },
};
