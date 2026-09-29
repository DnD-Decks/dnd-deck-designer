#!/usr/bin/env bash
set -euo pipefail

project_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
dist_root="$project_root/dist"

if [[ -d "$project_root/../.claude/skills/asset" ]]; then
  node "$project_root/scripts/style-catalog.mjs" --check
fi
rm -rf "$dist_root"
mkdir -p "$dist_root/server" "$dist_root/.openai"
node --input-type=module - "$project_root" "$dist_root" <<'JS'
import { readFile, writeFile } from 'node:fs/promises';
const [project, dist] = process.argv.slice(2);
const source = await readFile(`${project}/worker/index.js`, 'utf8');
const catalog = await readFile(`${project}/worker/visual-styles.js`, 'utf8');
const marker = 'import { STYLE_CATALOG } from "./visual-styles.js";';
if (!source.startsWith(marker)) throw Error('Worker style catalog import missing');
await writeFile(`${dist}/server/index.js`, source.replace(marker, catalog.replace('export const STYLE_CATALOG', 'const STYLE_CATALOG')));
JS
cp "$project_root/.openai/hosting.json" "$dist_root/.openai/hosting.json"

echo "Built $dist_root"
