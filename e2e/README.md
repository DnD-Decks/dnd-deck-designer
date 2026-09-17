# End-to-end suite

Playwright drives the real app in a browser. The suite is **offline by construction**: the app
bundles its own JSON and serves every icon from the dev server, so there is no backend to mock —
instead a network guard aborts anything cross-origin and says so on stdout.

## Layout

```
e2e/
├── app/                        # *.spec.ts — one describe per file, named ${page}.${feature}
├── integration/                # plumbing only, no test cases
│   ├── global.setup.ts         # called at module level by every spec
│   ├── network.guard.ts        # catch-all route: same-origin through, cross-origin aborted
│   ├── home.page.ts            # page object: locators + intent helpers, no assertions
│   └── fixtures/test.extend.ts # `test`/`expect` every spec imports
├── playwright.config.ts
├── Dockerfile
└── docker-compose.yml
```

## Running

```bash
pnpm e2e                      # host run; starts vite itself, reuses one already running
pnpm e2e --grep "print"       # all Playwright CLI flags pass through
pnpm e2e:docker               # the same suite in the pinned Playwright image
```

`pnpm blue-ball` deliberately leaves e2e out — it needs browsers, not just node.

## Snapshots

`toHaveScreenshot` is used on **card locators only**, where the printed layout is the feature.
Host fonts and antialiasing differ from the image's, so baselines are Docker-made and host runs
skip the visual assertions entirely (`ignoreSnapshots: !CI`). To refresh a baseline after an
intentional layout change:

```bash
pnpm e2e:docker --update-snapshots
```

The baselines land in `app/<spec>-snapshots/` through the compose mount; commit them.

## Conventions

- Specs import `test`/`expect` from `integration/fixtures/test.extend.ts`, never from
  `@playwright/test`.
- Query by role and accessible name. If an element cannot be reached that way, fix the
  component — `deck-view` grew `aria-label` on its sections for exactly this reason.
- `expect.soft` for the several checks that describe one feature; hard `expect` only for
  preconditions the rest of the test depends on.
- No `waitForTimeout`, no shared state between tests.

## Not covered

- The deck empty state (`No cards vendored for …`) is unreachable in the browser: all 12 classes
  ship level-1 cards. It stays a vitest test with a mocked model.
- One desktop project only. The app is a print workbench sized in mm; a phone project would add
  a second set of baselines without testing a supported use.

## Keeping Docker in step

The image tag in `Dockerfile` / `docker-compose.yml` must equal the `@playwright/test` version in
`package.json` (currently `1.63.0`). A mismatch shows up as "browser not found".
