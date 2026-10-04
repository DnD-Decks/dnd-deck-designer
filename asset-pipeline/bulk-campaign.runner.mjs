import { execFileSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, rename, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import {
  applyVisualStyle,
  parseAssetIssue,
  previewDimensions,
  promptForDimensions,
} from "./worker/index.js";
import { STYLE_CATALOG } from "./worker/visual-styles.js";

const OWNER = "DnD-Decks";
const REPOSITORY = "dnd-deck-designer";
const MODEL = "gpt-image-2.5-flare";
const CAMPAIGN_STARTED_AT = "2026-10-02T15:25:49.152Z";
const API_ROOT = "https://api.openai.com/v1";
const GITHUB_ROOT = "https://api.github.com";
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..");
const draftRoot = path.join(scriptDirectory, "drafts");
const stateDirectory = path.join(scriptDirectory, ".cache");
const statePath = path.join(stateDirectory, "bulk-campaign-state.json");
const trackerPath = "asset-pipeline/campaign-status.md";
const styleIds = new Set(STYLE_CATALOG.map((style) => style.id));
const maxMinutes = optionNumber("--max-minutes", Number.POSITIVE_INFINITY);
const intervalSeconds = optionNumber("--interval-seconds", 65);
const dryRun = process.argv.includes("--dry-run");
const executionStartedAt = Date.now();
const deadline = Date.now() + maxMinutes * 60_000;
let campaignIssues = [];
let haltReason = null;

function optionNumber(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index < 0) return fallback;
  const value = Number(process.argv[index + 1]);
  if (!Number.isFinite(value) || value <= 0) throw new Error(`Invalid value for ${name}.`);
  return value;
}

function git(args, capture = true) {
  const output = execFileSync("git", args, {
    cwd: repositoryRoot,
    encoding: capture ? "utf8" : undefined,
    stdio: capture ? ["ignore", "pipe", "pipe"] : "inherit",
  });
  return capture ? output.trim() : "";
}

function safeWorktree() {
  if (git(["branch", "--show-current"]) !== "main") {
    throw new Error("Switch to main before running the campaign.");
  }
  const status = git(["status", "--porcelain"]);
  const unsafe = status
    .split("\n")
    .filter(Boolean)
    .filter((line) => {
      const file = line.slice(3);
      return (
        !line.startsWith("??") ||
        (!file.endsWith(".DS_Store") && file !== "asset-pipeline/bulk-campaign.runner.mjs")
      );
    });
  if (unsafe.length) {
    throw new Error(
      "The worktree has other changes. Commit or move them before running the campaign."
    );
  }
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    signal: AbortSignal.timeout(options.timeoutMs || 90_000),
    headers: {
      accept: "application/json",
      "user-agent": "dnd-deck-asset-bulk-runner",
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  return { response, data };
}

function redacted(message, secret) {
  return String(message || "Unknown error")
    .replaceAll(secret, "[redacted]")
    .slice(0, 260);
}

export function accountStopReason(message) {
  if (
    /no credits remaining|insufficient_quota|exceeded your current quota|billing.*hard.limit/i.test(
      message
    )
  ) {
    return { status: "credits-exhausted", error: message };
  }
  if (/HTTP 401|incorrect api key|invalid_api_key|expired.*api.key/i.test(message)) {
    return { status: "credential-error", error: message };
  }
  return null;
}

function recordAccountError(message) {
  haltReason ||= accountStopReason(message);
}

export function submittedDuringRun(request, response, startedAt) {
  const submittedAt = request.submittedAt
    ? Date.parse(request.submittedAt)
    : Number(response.created_at) * 1000;
  return Number.isFinite(submittedAt) && submittedAt >= startedAt;
}

async function githubIssues() {
  const issues = [];
  for (let page = 1; page <= 10; page += 1) {
    const query = new URLSearchParams({
      state: "open",
      labels: "ASSET",
      per_page: "100",
      page: String(page),
    });
    const { response, data } = await requestJson(
      `${GITHUB_ROOT}/repos/${OWNER}/${REPOSITORY}/issues?${query}`
    );
    if (!response.ok || !Array.isArray(data)) {
      throw new Error(`GitHub issue listing failed (HTTP ${response.status}).`);
    }
    issues.push(...data.filter((issue) => !issue.pull_request));
    if (data.length < 100) break;
  }
  return issues
    .map((raw) => ({ ...parseAssetIssue(raw), createdAt: raw.created_at }))
    .sort((a, b) => a.number - b.number);
}

async function archivedStyles(issueNumber) {
  const found = new Set();
  const prefixes = await readdir(draftRoot, { withFileTypes: true }).catch(() => []);
  for (const folder of prefixes.filter(
    (entry) => entry.isDirectory() && entry.name.startsWith(`${issueNumber}-`)
  )) {
    const runs = await readdir(path.join(draftRoot, folder.name), { withFileTypes: true }).catch(
      () => []
    );
    for (const run of runs.filter((entry) => entry.isDirectory())) {
      try {
        const raw = await readFile(path.join(draftRoot, folder.name, run.name, "run.json"), "utf8");
        const manifest = JSON.parse(raw);
        for (const candidate of manifest.candidates || []) {
          if (!styleIds.has(candidate.styleId)) continue;
          const extension = (candidate.format || manifest.format) === "jpeg" ? "jpg" : "png";
          const image = await stat(
            path.join(draftRoot, folder.name, run.name, `draft-0${candidate.id}.${extension}`)
          ).catch(() => null);
          if (image?.isFile() && image.size > 0) found.add(candidate.styleId);
        }
      } catch {
        // Incomplete folders do not count as archived styles.
      }
    }
  }
  return found;
}

async function hadPreCampaignDraft(issueNumber) {
  const prefixes = await readdir(draftRoot, { withFileTypes: true }).catch(() => []);
  for (const folder of prefixes.filter(
    (entry) => entry.isDirectory() && entry.name.startsWith(`${issueNumber}-`)
  )) {
    const runs = await readdir(path.join(draftRoot, folder.name), { withFileTypes: true }).catch(
      () => []
    );
    for (const run of runs.filter((entry) => entry.isDirectory())) {
      try {
        const raw = await readFile(path.join(draftRoot, folder.name, run.name, "run.json"), "utf8");
        const manifest = JSON.parse(raw);
        if (
          Date.parse(manifest.createdAt) < Date.parse(CAMPAIGN_STARTED_AT) &&
          (manifest.candidates || []).length
        )
          return true;
      } catch {
        // Invalid or incomplete manifests do not count as prior drafts.
      }
    }
  }
  return false;
}

async function loadState() {
  try {
    return JSON.parse(await readFile(statePath, "utf8"));
  } catch {
    return { version: 1, issues: {} };
  }
}

async function saveState(state) {
  await mkdir(stateDirectory, { recursive: true });
  const temporary = `${statePath}.tmp`;
  await writeFile(temporary, `${JSON.stringify(state, null, 2)}\n`, { mode: 0o600 });
  await rename(temporary, statePath);
}

async function updateTracker(state, currentIssue = null) {
  const issues = [];
  for (const issue of campaignIssues) {
    const archived = await archivedStyles(issue.number);
    const job = state.issues[issue.number];
    const requests = job?.requests.filter((request) => !archived.has(request.styleId)) || [];
    issues.push({
      number: issue.number,
      name: issue.name || issue.title,
      stylesSaved: archived.size,
      status: archived.size === 37 ? "complete" : archived.size ? "partial" : "queued",
      pending: requests.filter((request) => request.status === "pending").length,
      failures: requests
        .filter((request) => request.status === "failed")
        .map((request) => ({
          styleId: request.styleId,
          attempts: request.attempts,
          error: request.error,
        })),
    });
  }
  const tracker = {
    updatedAt: new Date().toISOString(),
    status:
      haltReason?.status ||
      (issues.every((issue) => issue.stylesSaved === 37) ? "complete" : "running"),
    currentIssue,
    completedIssues: issues.filter((issue) => issue.stylesSaved === 37).length,
    totalIssues: issues.length,
    savedStyles: issues.reduce((total, issue) => total + issue.stylesSaved, 0),
    requiredStyles: issues.length * 37,
    stopReason: haltReason,
    issues,
  };
  await writeFile(
    path.join(stateDirectory, "campaign-status.json"),
    `${JSON.stringify(tracker, null, 2)}\n`
  );
  const rows = issues.map(
    (issue) =>
      `| [#${issue.number}](https://github.com/${OWNER}/${REPOSITORY}/issues/${issue.number}) ${issue.name.replaceAll("|", " ")} | ${issue.stylesSaved}/37 | ${issue.status} | ${issue.pending} | ${issue.failures.length} |`
  );
  const errors = issues.flatMap((issue) =>
    issue.failures.map(
      (failure) =>
        `- #${issue.number}, ${failure.styleId} (attempt ${failure.attempts}): ${failure.error}`
    )
  );
  const markdown = [
    "# Draft campaign progress",
    "",
    `Updated: ${tracker.updatedAt}. Status: **${tracker.status}**.`,
    "",
    `**${tracker.completedIssues}/${tracker.totalIssues} issues complete; ${tracker.savedStyles}/${tracker.requiredStyles} styles archived.**`,
    "",
    `Current issue: ${currentIssue ? `#${currentIssue}` : "none"}. This is the original 93-issue non-weapon queue. Each issue requires all 37 catalog styles. Counts require an image file and its manifest. Drafts and this tracker are pushed together to GitHub main.`,
    "",
    "GitHub issues remain open for artwork review. The Site's independent queue counters are not updated by this local runner.",
    "",
    ...(haltReason ? [`Stopped: ${haltReason.error}`, ""] : []),
    "| Issue | Styles archived | Status | Pending API jobs | Failed requests |",
    "| --- | ---: | --- | ---: | ---: |",
    ...rows,
    "",
    ...(errors.length ? ["## Request errors", "", ...errors, ""] : []),
  ].join("\n");
  await writeFile(path.join(repositoryRoot, trackerPath), markdown);
  return tracker;
}

function issueFolder(issue) {
  const slug = issue.title
    .replace(/^\[asset\]:\s*/i, "")
    .replace(/\`/g, "")
    .normalize("NFKD")
    .replace(/\p{Mark}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 70)
    .replace(/-$/g, "");
  return `asset-pipeline/drafts/${issue.number}-${slug || "card"}`;
}

function generationPlan(issue) {
  const dimensions = previewDimensions(issue.orientation);
  return STYLE_CATALOG.map((style, index) => ({
    id: index + 1,
    title: "Same scene",
    description: "Independent image using the same assembled prompt.",
    styleId: style.id,
    styleName: style.name,
    styleFamily: style.family,
    stylePrompt: style.prompt,
    generationPrompt: promptForDimensions(
      applyVisualStyle(issue.prompt, style.prompt),
      dimensions.width,
      dimensions.height,
      ""
    ),
  }));
}

async function openAI(prompt, key, rateLimitRetries = 0) {
  const { response, data } = await requestJson(`${API_ROOT}/responses`, {
    method: "POST",
    timeoutMs: 120_000,
    headers: {
      authorization: `Bearer ${key}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-5.4-mini",
      reasoning: { effort: "low" },
      background: true,
      store: true,
      tool_choice: { type: "image_generation" },
      tools: [
        {
          type: "image_generation",
          model: MODEL,
          size: prompt.size,
          quality: "low",
          output_format: "jpeg",
          output_compression: 65,
          background: "opaque",
        },
      ],
      input: [
        {
          role: "user",
          content: [{ type: "input_text", text: `Generate one image. ${prompt.text}` }],
        },
      ],
    }),
  });
  const message = redacted(
    data?.error?.message || data?.error?.code || `HTTP ${response.status}`,
    key
  );
  if (!response.ok && accountStopReason(message)) {
    recordAccountError(message);
    throw new Error(message);
  }
  if (response.status === 429) {
    if (rateLimitRetries >= 5) throw new Error("Image rate limit persisted after five backoffs.");
    const wait = Math.max(15, Math.min(120, Number(response.headers.get("retry-after")) || 60));
    await new Promise((resolve) => setTimeout(resolve, wait * 1000));
    return openAI(prompt, key, rateLimitRetries + 1);
  }
  if (!response.ok)
    throw new Error(
      `OpenAI request failed (HTTP ${response.status}): ${redacted(data?.error?.message, key)}`
    );
  if (!data.id) throw new Error("OpenAI did not return a background response ID.");
  return data;
}

async function submit(request, dimensions, key) {
  request.attempts += 1;
  request.submittedAt = new Date().toISOString();
  try {
    const data = await openAI(
      {
        text: request.generationPrompt,
        size: `${dimensions.width}x${dimensions.height}`,
      },
      key
    );
    request.responseId = data.id;
    request.status = "pending";
    request.error = null;
  } catch (error) {
    request.status = "failed";
    request.error = redacted(error.message, key);
    recordAccountError(request.error);
  }
}

async function poll(request, key) {
  const { response, data } = await requestJson(
    `${API_ROOT}/responses/${encodeURIComponent(request.responseId)}`,
    { headers: { authorization: `Bearer ${key}` } }
  );
  if (!response.ok) {
    recordAccountError(
      redacted(data?.error?.message || data?.error?.code || `HTTP ${response.status}`, key)
    );
    if (haltReason) {
      request.status = "failed";
      request.error = haltReason.error;
      request.responseId = null;
      return;
    }
    if (response.status === 429 || response.status >= 500) return;
    request.status = "failed";
    request.error = redacted(data?.error?.message || `OpenAI returned ${response.status}`, key);
    recordAccountError(response.status === 401 ? `HTTP 401: ${request.error}` : request.error);
    request.responseId = null;
    return;
  }
  if (["queued", "in_progress"].includes(data.status)) return;
  if (data.status !== "completed") {
    request.status = "failed";
    request.error = redacted(
      data.error?.message || data.incomplete_details?.reason || data.status,
      key
    );
    if (submittedDuringRun(request, data, executionStartedAt)) recordAccountError(request.error);
    request.responseId = null;
    return;
  }
  const result = data.output?.find(
    (entry) => entry.type === "image_generation_call" && entry.result
  )?.result;
  if (!result) {
    request.status = "failed";
    request.error = "OpenAI completed without an image.";
    request.responseId = null;
    return;
  }
  request.image = result;
  request.status = "ready-to-save";
}

function jpegDimensions(bytes) {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  let offset = 2;
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    while (bytes[offset] === 0xff) offset += 1;
    const marker = bytes[offset++];
    if ([0xd8, 0xd9, 0x01].includes(marker) || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (offset + 2 > bytes.length) break;
    const length = bytes.readUInt16BE(offset);
    if (
      [0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(
        marker
      )
    ) {
      if (offset + 7 > bytes.length) return null;
      return { height: bytes.readUInt16BE(offset + 3), width: bytes.readUInt16BE(offset + 5) };
    }
    offset += length;
  }
  return null;
}

function candidateFrom(request) {
  const { image, attempts, maxAttempts, submittedAt, responseId, status, error, ...candidate } =
    request;
  return candidate;
}

export function mergeArchivedCandidates(previous, requests) {
  const candidates = new Map(
    previous.map((candidate) => [candidate.styleId || candidate.id, candidate])
  );
  for (const request of requests.filter((request) => request.status === "saved")) {
    candidates.set(request.styleId || request.id, candidateFrom(request));
  }
  return [...candidates.values()].sort((a, b) => a.id - b.id);
}

async function saveArchive(issue, job, dimensions, final = false) {
  if (
    !final &&
    !job.requests.some((request) => ["saved", "ready-to-save"].includes(request.status))
  )
    return;
  const folder = path.join(repositoryRoot, job.folder);
  const runFolder = path.join(folder, job.runId);
  await mkdir(runFolder, { recursive: true });
  const previous = await readFile(path.join(runFolder, "run.json"), "utf8")
    .then(JSON.parse)
    .catch(() => ({}));
  for (const request of job.requests.filter((item) => item.status === "ready-to-save")) {
    const image = Buffer.from(request.image, "base64");
    const measured = jpegDimensions(image);
    if (!measured || measured.width !== dimensions.width || measured.height !== dimensions.height) {
      request.status = "failed";
      request.error = "Unexpected image dimensions.";
      request.image = undefined;
      continue;
    }
    await writeFile(path.join(runFolder, `draft-0${request.id}.jpg`), image);
    request.status = "saved";
    request.image = undefined;
  }
  const failures = job.requests
    .filter((request) => request.status === "failed")
    .map((request) => `Draft 0${request.id}: ${request.error}`);
  const manifest = {
    ...previous,
    issue: issue.number,
    runId: job.runId,
    createdAt: job.createdAt,
    prompt: issue.prompt,
    model: MODEL,
    quality: "low",
    format: "jpeg",
    size: dimensions,
    candidates: mergeArchivedCandidates(previous.candidates || [], job.requests),
    failures,
    finalVersions: previous.finalVersions || {},
    tweaks: previous.tweaks || [],
    submissions: previous.submissions || {},
  };
  await writeFile(path.join(runFolder, "run.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  await saveState(globalThis.campaignState);
  await updateTracker(globalThis.campaignState, issue.number);
  commitArchive(job.folder, issue, job.runId);
}

function commitArchive(folder, issue, runId) {
  const paths = folder ? [folder, trackerPath] : [trackerPath];
  git(["add", "--", ...paths]);
  const staged = git(["status", "--porcelain", "--", ...paths]);
  if (!staged) return;
  git([
    "commit",
    "-m",
    issue
      ? `Save issue #${issue.number} artwork archive (${runId.slice(0, 8)})`
      : "Update local draft campaign tracker",
  ]);
  git(["push", "origin", "main"]);
  console.log(JSON.stringify({ event: "pushed", commit: git(["rev-parse", "--short", "HEAD"]) }));
}

async function runIssue(issue, state, key) {
  const dimensions = previewDimensions(issue.orientation);
  const archived = await archivedStyles(issue.number);
  if (STYLE_CATALOG.every((style) => archived.has(style.id))) {
    delete state.issues[issue.number];
    return { status: "complete", archived: 37 };
  }
  if (!issue.ready || !issue.styleSwappable) {
    return {
      status: "skipped",
      error: issue.errors.join(" ") || "Issue prompt cannot use all 37 styles.",
    };
  }
  const plan = generationPlan(issue);
  const signature = createHash("sha256")
    .update(JSON.stringify({ prompt: issue.prompt, orientation: issue.orientation, plan }))
    .digest("hex");
  let job = state.issues[issue.number];
  const resuming = Boolean(job && job.signature === signature);
  if (!job || job.signature !== signature) {
    const missing = plan.filter((item) => !archived.has(item.styleId));
    job = {
      signature,
      runId: randomUUID(),
      createdAt: new Date().toISOString(),
      folder: issueFolder(issue),
      requests: missing.map((item) => ({
        ...item,
        attempts: 0,
        responseId: null,
        status: "queued",
        error: null,
      })),
    };
    state.issues[issue.number] = job;
    await saveState(state);
  } else if (resuming) {
    for (const request of job.requests) {
      request.maxAttempts = request.attempts + 3;
      if (request.status === "failed") {
        request.status = "queued";
      }
    }
  }
  for (const request of job.requests) {
    const file = path.join(repositoryRoot, job.folder, job.runId, `draft-0${request.id}.jpg`);
    if (request.status === "saved") continue;
    if (request.status === "ready-to-save" && request.image) continue;
    try {
      await readFile(file);
      request.status = "saved";
      request.responseId = null;
    } catch {}
    if (request.status === "failed" && request.attempts < (request.maxAttempts || 3))
      request.status = "queued";
  }
  job.requests = job.requests.filter(
    (request) => request.status === "saved" || !archived.has(request.styleId)
  );
  const runFolder = path.join(repositoryRoot, job.folder, job.runId);
  await mkdir(runFolder, { recursive: true });
  while (Date.now() < deadline && !haltReason) {
    for (const request of job.requests) {
      if (request.status === "failed" && request.attempts < (request.maxAttempts || 3))
        request.status = "queued";
    }
    const batch = job.requests
      .filter(
        (request) => request.status === "queued" && request.attempts < (request.maxAttempts || 3)
      )
      .slice(0, 4);
    if (batch.length) {
      await Promise.all(batch.map((request) => submit(request, dimensions, key)));
      await saveState(state);
    }
    const pending = job.requests.filter(
      (request) => request.status === "pending" && request.responseId
    );
    if (pending.length) {
      await Promise.all(
        pending.map((request) =>
          poll(request, key).catch((error) => {
            request.error = redacted(error.message, key);
          })
        )
      );
      await saveArchive(issue, job, dimensions);
      await saveState(state);
    } else {
      await saveArchive(issue, job, dimensions);
      await saveState(state);
    }
    const unfinished = job.requests.some(
      (request) =>
        ["queued", "pending", "ready-to-save"].includes(request.status) ||
        (request.status === "failed" && request.attempts < (request.maxAttempts || 3))
    );
    if (!unfinished || haltReason) break;
    const remaining = deadline - Date.now();
    if (remaining <= 0) break;
    await new Promise((resolve) =>
      setTimeout(resolve, Math.min(intervalSeconds * 1000, remaining))
    );
  }
  const completeIds = new Set(await archivedStyles(issue.number));
  for (const request of job.requests) {
    if (request.status === "saved") completeIds.add(request.styleId);
  }
  const done = STYLE_CATALOG.every((style) => completeIds.has(style.id));
  await saveArchive(issue, job, dimensions, true);
  await saveState(state);
  return {
    status: done
      ? "complete"
      : haltReason?.status || (Date.now() >= deadline ? "paused" : "incomplete"),
    archived: completeIds.size,
    errors: job.requests
      .filter((request) => request.status === "failed")
      .map((request) => ({ styleId: request.styleId, error: request.error })),
  };
}

async function main() {
  const key = process.env.OPENAI_API_KEY;
  if (!key && !dryRun) throw new Error("OPENAI_API_KEY must be set in the process environment.");
  if (STYLE_CATALOG.length !== 37)
    throw new Error(`Expected 37 styles, found ${STYLE_CATALOG.length}.`);
  safeWorktree();
  git(["pull", "--ff-only", "origin", "main"]);
  const state = await loadState();
  globalThis.campaignState = state;
  const eligible = (await githubIssues()).filter(
    (issue) =>
      issue.kind.toLowerCase() !== "weapon" &&
      Date.parse(issue.createdAt) <= Date.parse(CAMPAIGN_STARTED_AT)
  );
  const issues = [];
  for (const issue of eligible) {
    if (!(await hadPreCampaignDraft(issue.number))) issues.push(issue);
  }
  if (issues.length !== 93) {
    throw new Error(
      `Campaign snapshot mismatch: expected 93 queued issues, found ${issues.length}.`
    );
  }
  campaignIssues = issues;
  if (dryRun) {
    for (const issue of issues) {
      const archived = await archivedStyles(issue.number);
      const missing = STYLE_CATALOG.filter((style) => !archived.has(style.id)).length;
      if (missing) console.log(`#${issue.number} ${issue.title}: ${missing} styles missing`);
    }
    return;
  }
  const pending = [];
  let processedThisPass = 0;
  let completedThisPass = 0;
  let noProgressPasses = 0;
  let passIssues = issues;
  while (passIssues.length && Date.now() < deadline && !haltReason) {
    const before = await updateTracker(state);
    commitArchive();
    for (const issue of passIssues) {
      if (Date.now() >= deadline || haltReason) break;
      const result = await runIssue(issue, state, key);
      processedThisPass += 1;
      if (result.status === "complete") completedThisPass += 1;
      console.log(
        JSON.stringify({ issue: issue.number, title: issue.name || issue.title, ...result })
      );
      if (result.status !== "complete") pending.push({ issue: issue.number, ...result });
    }
    const after = await updateTracker(state);
    noProgressPasses = after.savedStyles > before.savedStyles ? 0 : noProgressPasses + 1;
    passIssues = [];
    for (const issue of issues) {
      if ((await archivedStyles(issue.number)).size < 37) passIssues.push(issue);
    }
    if (passIssues.length && noProgressPasses >= 3 && !haltReason) {
      haltReason = {
        status: "persistent-errors",
        error:
          "Three full queue passes produced no new images. See the tracker request errors; the queue is preserved.",
      };
    }
  }
  let completedIssues = 0;
  const remaining = [];
  for (const issue of issues) {
    const archived = await archivedStyles(issue.number);
    const missingStyles = STYLE_CATALOG.filter((style) => !archived.has(style.id)).length;
    if (!missingStyles) completedIssues += 1;
    else remaining.push({ issue: issue.number, archived: archived.size, missingStyles });
  }
  console.log(
    JSON.stringify({
      checkpoint: true,
      completedThisPass,
      processedThisPass,
      unprocessedThisPass: Math.max(0, issues.length - processedThisPass),
      completedIssues,
      remainingIssues: remaining.length,
      openNonWeaponIssues: issues.length,
      pending,
      remaining,
      stateFile: path.relative(repositoryRoot, statePath),
    })
  );
  await saveState(state);
  const tracker = await updateTracker(state);
  commitArchive();
  console.log(
    JSON.stringify({
      event: "finished",
      status: tracker.status,
      completedIssues,
      remainingIssues: remaining.length,
      stopReason: haltReason,
    })
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
