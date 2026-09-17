// Called at module level in every spec. Must be idempotent — fullyParallel runs it per worker.
let done = false;

/**
 * The suite is offline by construction: the app bundles its own data and the network guard
 * aborts anything cross-origin. Pointing BASE_URL at a deployed site would silently turn these
 * specs into a smoke test against production, so refuse it unless asked explicitly.
 */
export function globalSetup() {
  if (done) return;
  done = true;

  const baseURL = process.env.BASE_URL;
  if (!baseURL || process.env.E2E_ALLOW_REMOTE === "1") return;

  const { hostname } = new URL(baseURL);
  const local = hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
  if (!local) {
    throw new Error(
      `BASE_URL points at ${hostname}; this suite only runs against a local dev server. Set E2E_ALLOW_REMOTE=1 if you really mean it.`
    );
  }
}
