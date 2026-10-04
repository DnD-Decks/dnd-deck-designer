import assert from "node:assert/strict";
import test from "node:test";
import { accountStopReason, mergeArchivedCandidates } from "../bulk-campaign.runner.mjs";

test("resuming a partial archive preserves all old candidates and adds missing styles", () => {
  const previous = Array.from({ length: 29 }, (_, index) => ({
    id: index + 1,
    styleId: `style-${index + 1}`,
    generationPrompt: "Original prompt",
  }));
  const requests = Array.from({ length: 8 }, (_, index) => ({
    id: index + 30,
    styleId: `style-${index + 30}`,
    generationPrompt: "New prompt",
    status: "saved",
    responseId: "private-response-id",
    attempts: 2,
    maxAttempts: 5,
    image: "private-image-data",
  }));
  const candidates = mergeArchivedCandidates(previous, requests);
  assert.equal(candidates.length, 37);
  assert.deepEqual(candidates.slice(0, 29), previous);
  assert.equal(candidates[36].id, 37);
  for (const candidate of candidates) {
    assert.equal("responseId" in candidate, false);
    assert.equal("image" in candidate, false);
    assert.equal("attempts" in candidate, false);
    assert.equal("maxAttempts" in candidate, false);
  }
});

test("billing exhaustion halts generation while ordinary image failures remain retryable", () => {
  const error = "You have no credits remaining. Add credits to continue using the API.";
  assert.deepEqual(accountStopReason(error), { status: "credits-exhausted", error });
  assert.equal(accountStopReason("insufficient_quota").status, "credits-exhausted");
  assert.equal(accountStopReason("HTTP 401: Incorrect API key").status, "credential-error");
  assert.equal(accountStopReason("OpenAI completed without an image."), null);
  assert.equal(accountStopReason("Image rate limit persisted after five backoffs."), null);
});
