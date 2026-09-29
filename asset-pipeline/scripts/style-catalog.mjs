import { readFile, readdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const project = resolve(fileURLToPath(new URL("..", import.meta.url)));
const source = resolve(project, "../.claude/skills/asset");
const output = resolve(project, "worker/visual-styles.js");
const files = (await readdir(source))
  .filter((name) => /^visual-style-[a-z-]+(?:-\d\d)?\.md$/.test(name))
  .sort();
const styles = await Promise.all(
  files.map(async (filename) => {
    const raw = await readFile(resolve(source, filename), "utf8");
    const match = raw.match(/^---\nname: ([^\n]+)\nfamily: ([^\n]+)\n---\n\n([\s\S]+)$/);
    if (!match) throw Error(`Missing name/family metadata: ${filename}`);
    return {
      id: filename.slice("visual-style-".length, -".md".length),
      name: match[1],
      family: match[2],
      prompt: match[3].trim(),
    };
  })
);
if (styles.length !== 19 || styles.some((item) => !item.prompt))
  throw Error("Expected 19 complete visual styles.");
const moduleText = `// Generated from .claude/skills/asset/visual-style-*.md by scripts/style-catalog.mjs.\nexport const STYLE_CATALOG = ${JSON.stringify(styles, null, 2)};\n`;
if (process.argv.includes("--check")) {
  if ((await readFile(output, "utf8")) !== moduleText)
    throw Error("Visual style catalog is stale. Run npm run styles.");
} else {
  await writeFile(output, moduleText);
}
console.log(`Validated ${styles.length} visual styles`);
