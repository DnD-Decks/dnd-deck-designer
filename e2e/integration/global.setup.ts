let done = false;

/** Guards against BASE_URL pointing at a deployment, which would turn the suite into a
 * production smoke test. Idempotent: every spec calls it, fullyParallel runs it per worker. */
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
