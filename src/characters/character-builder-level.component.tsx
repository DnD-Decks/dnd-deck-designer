import type { ChangeEvent } from "react";
import type { CharacterClass } from "src/models/class/classes.model";
import type { CharacterLevel, LandType, SubclassId } from "src/models/class/progression.model";
import { progression } from "src/models/class/progression.model";
import styles from "./character-builder.module.css";

type Props = {
  cls?: CharacterClass;
  level: CharacterLevel;
  land: LandType;
  subclass: SubclassId;
  onLevel: (level: CharacterLevel) => void;
  onLand: (land: LandType) => void;
  onSubclass: (subclass: SubclassId) => void;
};

export function BuilderLevel({ cls, level, land, subclass, onLevel, onLand, onSubclass }: Props) {
  const options = cls ? progression.subclasses({ cls, level }) : [];
  const label = cls && progression.subclass({ cls, level, subclass });
  const chooseLevel = (event: ChangeEvent<HTMLSelectElement>) => {
    const selected = Number(event.target.value);
    if (progression.isLevel(selected)) onLevel(selected);
  };
  const chooseLand = (event: ChangeEvent<HTMLSelectElement>) => {
    const selected = event.target.value;
    if (progression.isLand(selected)) onLand(selected);
  };
  const chooseSubclass = (event: ChangeEvent<HTMLSelectElement>) => {
    const selected = event.target.value;
    if (progression.isSubclass(selected)) onSubclass(selected);
  };

  return (
    <>
      <div className={styles.settings}>
        <label className={styles.setting}>
          Character level
          <select className={styles.select} value={level} onChange={chooseLevel}>
            {progression.levels.map((value) => (
              <option key={value} value={value}>
                Level {value}
              </option>
            ))}
          </select>
        </label>
        {options.length > 0 && (
          <label className={styles.setting}>
            Subclass
            <select className={styles.select} value={subclass} onChange={chooseSubclass}>
              {options.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        )}
        {cls === "druid" && level === 3 && (
          <label className={styles.setting}>
            Land type
            <select className={styles.select} value={land} onChange={chooseLand}>
              {progression.lands.map((value) => (
                <option key={value} value={value}>
                  {value.charAt(0).toUpperCase() + value.slice(1)}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      {label && options.length === 0 && <p className={styles.hint}>Includes {label}.</p>}
    </>
  );
}
