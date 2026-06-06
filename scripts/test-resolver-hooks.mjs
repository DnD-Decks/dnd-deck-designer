import path from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();
const SOURCE_EXTS = new Set([".ts", ".tsx", ".js", ".mjs", ".json"]);

function hasSourceExtension(p) {
  return SOURCE_EXTS.has(path.extname(p));
}

export function resolve(specifier, _context, nextResolve) {
  if (!specifier.startsWith("src/")) {
    return nextResolve(specifier, _context);
  }

  // Append .ts when the specifier has no recognised source extension.
  // Handles names like "spells.model" where path.extname() returns ".model".
  const resolved = hasSourceExtension(specifier) ? specifier : `${specifier}.ts`;

  const fileUrl = pathToFileURL(path.join(ROOT, resolved)).href;
  const next = nextResolve(fileUrl, _context);

  return Promise.resolve(next).then((r) =>
    r.url.endsWith(".json") ? { ...r, importAttributes: { type: "json" } } : r
  );
}
