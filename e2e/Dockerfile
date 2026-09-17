# Tag MUST match the exact @playwright/test version in package.json:
#   grep '"@playwright/test"' package.json
ARG PW_VERSION=1.63.0
FROM mcr.microsoft.com/playwright:v${PW_VERSION}-noble

WORKDIR /work
ENV CI=1

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN pnpm install --frozen-lockfile

COPY . .

# Everything after the service name goes straight to the Playwright CLI:
#   docker compose -f e2e/docker-compose.yml run --rm e2e --grep "print" --update-snapshots
ENTRYPOINT ["pnpm", "exec", "playwright", "test", "--config", "e2e/playwright.config.ts"]
CMD []
