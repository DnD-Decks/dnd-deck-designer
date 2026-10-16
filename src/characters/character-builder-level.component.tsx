import type { ChangeEvent } from "react";
import type { CharacterClass } from "src/models/class/classes.model";
import type { CharacterLevel, LandType } from "src/models/class/progression.model";
import { progression } from "src/models/class/progression.model";
import styles from "./character-builder.module.css";

type Props = {
  cls?: CharacterClass;
  level: CharacterLevel;
  land: LandType;
  onLevel: (level: CharacterLevel) => void;
  onLand: (land: LandType) => void;
};

export function BuilderLevel({ cls, level, land, onLevel, onLand }: Props) {
  const subclass = cls && progression.subclass({ cls, level });
  const chooseLevel = (event: ChangeEvent<HTMLSelectElement>) => {
    const selected = Number(event.target.value);
    if (progression.isLevel(selected)) onLevel(selected);
  };
  const chooseLand = (event: ChangeEvent<HTMLSelectElement>) => {
    const selected = event.target.value;
    if (progression.isLand(selected)) onLand(selected);
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
      {subclass && (
        <p className={styles.hint}>
          Includes {subclass}. One subclass per class is available in SRD 5.2.1.
        </p>
      )}
    </>
  );
}
