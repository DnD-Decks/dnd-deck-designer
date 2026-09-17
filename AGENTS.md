## Plan Mode

- Make the plan extremely concise. Sacrifice grammar for the sake of concision.
- At the end of each plan, give me a list of unresolved questions to answer, if any.

## Standards

- **Filenames**: always `kebab-case`. Never PascalCase or camelCase file names.
- **Filename pattern**: `<module>.<role>.ts(x)` — e.g. `wizard.controller.ts`, `spell.service.ts`, `feat-card.component.tsx`. The module comes first, the role second.
- import: use absolute `src/*` paths.
- use relative imports only for same-folder files (e.g. CSS modules: `./spell-card.module.css`).
- sanctioned exception: **runtime** imports in modules that also run under `node:test` use relative paths with the `.ts` extension (the `src/*` alias only exists for tsc and vite) — see `src/decks/deck.model.ts`. Type-only imports keep the `src/*` form.
- use `import type` for type-only imports.
- prefer `type` for data shapes; reserve `interface` for semantic behavior contracts (e.g. `Runnable { run() }`).
- Prefer plain functions and closures over `class` syntax.
- Use **function factories** for encapsulation and polymorphism.
- no `this`, no `new`, no class-based patterns.
- let TypeScript infer return types; only annotate when inference fails or the public API needs it explicit.

### Folder layout

- Forbidden folders: `src/utils/`, `src/types/`, `src/helpers/`. No catch-alls.
- Name every folder by its domain. Types live with their domain.
- If a helper doesn't belong to an existing domain folder, prefer folding it into the model it serves as a projection over creating a standalone file.
- When a standalone file is genuinely needed, pick a per-domain folder name.
- Accepted non-domain folders: `src/data/` (JSON data files), `src/services/` (I/O), `src/lib/` (low-level primitives), `src/styles/` (global CSS, print layout).

### Tooling (repo-specific)

- **Bundler**: Vite + React + TypeScript.
- **Styles**: `*.module.css` (CSS modules). No CSS-in-JS, no Tailwind.
- **Tests**: `vitest` for component tests; `node:test` is acceptable for pure model/logic tests; `Playwright` for end-to-end (`e2e/`, excluded from the vitest run).
- **Lint/format**: biome.
- **Package manager**: pnpm.
- **Minimize dependencies**: every new `dependency` or `devDependency` must be justified. Prefer solving in userland before reaching for a package.
- **Exact versions only**: never `^`/`~` ranges in `package.json`. `.npmrc` sets `save-exact=true` so `pnpm add` does this automatically.
- **Composite check**: `pnpm blue-ball` = lint + test + build. Run before pushing. It excludes e2e (browsers, not node) — run `pnpm e2e` separately for UI changes.

### Testing

- Component tests render through `@testing-library/react` in a jsdom environment (vitest handles setup via `test/setup.ts` — tests never configure the DOM themselves).
- Co-locate test files: `<module>.<role>.test.tsx` beside the component. Pure model logic stays `*.model.test.ts`.
- **Query as a user perceives the UI**, in priority order:
  1. role + accessible name — `getByRole("button", { name: "Wizard" })`
  2. label / visible text — `getByLabelText`, `getByText`
  3. last resort: `getByTestId` — a test-id signals missing role or label; fix the component instead
- Never query by CSS class, tag name, or DOM shape — styling is not the contract.
- Assert behavior: what the user sees and what handlers receive. Use `fireEvent` for interaction; assert via role/state (`aria-pressed`) and handler spies.
- **Accessibility is the test contract**: if an element isn't reachable by role + name, add the semantic tag or `aria-label` to the component — don't reach past it. Components ship semantic HTML and accessible names by default.

### End-to-end (`e2e/`)

- Playwright, one desktop project, no network: the app has no backend to mock, so a catch-all route lets same-origin through and aborts (and logs) anything cross-origin.
- Specs live in `e2e/app/` as `${page}.${feature}.spec.ts`, one `describe` per file; plumbing (fixtures, page objects, network guard) lives in `e2e/integration/`.
- Never import `@playwright/test` in a spec — import `test`/`expect` from `e2e/integration/fixtures/test.extend.ts`.
- `toHaveScreenshot` on card locators only; baselines are Docker-made (`pnpm e2e:docker --update-snapshots`). Host runs skip visual assertions.
- Full conventions: [e2e/README.md](e2e/README.md).
