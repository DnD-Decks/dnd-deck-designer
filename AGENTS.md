## Plan Mode

**Always enter Plan mode before starting** when the task involves any of the following:

- Designing or redesigning a card component (layout, visual identity, print geometry)
- Deciding where a component lives in the app (routing, deck structure, page layout)
- Writing or rewriting more than one file at a time
- Any task where the user describes *what they want* but leaves *how* open (e.g. "design X", "create X", "figure out where Y goes")
- Architectural decisions (new card categories, new data flows, new models or types)

/---

- Make the plan extremely concise. Sacrifice grammar for the sake of concision.
- At the end of each plan, give me a list of unresolved questions to answer, if any.

## Standards

- import: use absolute `src/*` paths.
- use relative imports only for same-folder files (e.g. CSS modules: `./Card.module.css`).
- use `import type` for type-only imports.
- prefer `type` for data shapes; reserve `interface` for semantic behavior contracts (e.g. `Runnable { run() }`).
- Prefer plain functions and closures over `class` syntax.
- Use **function factories** for encapsulation and polymorphism.
- no `this`, no `new`, no class-based patterns.
- let TypeScript infer return types; only annotate when inference fails or the public API needs it explicit.

### Folder layout

- Forbidden folders: `src/utils/`, `src/types/`, `src/helpers/`. No catch-alls.
- Name every folder by its domain. Types live with their domain — e.g. `Spell` type in `src/cards/`, `ClassDetail` type in `src/decks/`, not a shared `types/` folder.
- If a helper doesn't belong to an existing domain folder, prefer folding it into the model it serves as a projection over creating a standalone file.
- When a standalone file is genuinely needed, pick a per-domain folder name.
- Accepted non-domain folders: `src/data/` (JSON data files), `src/services/` (I/O), `src/lib/` (low-level primitives), `src/styles/` (global CSS, print layout).

### Tooling (repo-specific)

- **Bundler**: Vite + React + TypeScript.
- **Styles**: `*.module.css` (CSS modules). No CSS-in-JS, no Tailwind.
- **Tests**: `node:test` (built into Node ≥ 22). **Never vitest**.
- **Lint/format**: biome.
- **Package manager**: pnpm.
- **Minimize dependencies**: every new `dependency` or `devDependency` must be justified. Prefer solving in userland before reaching for a package.
- **Composite check**: `pnpm blue-ball` = lint + test + build. Run before pushing.
