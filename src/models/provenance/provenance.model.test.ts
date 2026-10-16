import type { Provenance } from "src/models/provenance/provenance.model";
import { provenance } from "src/models/provenance/provenance.model";
import { describe, expect, test } from "vitest";

describe("provenance.resolve()", () => {
  test("undeclared provenance defaults to the open SRD source", () => {
    expect(provenance.resolve()).toMatchObject({
      id: "srd-5.2.1",
      openContent: true,
      license: "CC-BY-4.0",
    });
  });

  test("distinguishes publication, consulted site, page, and licensing", () => {
    expect(provenance.resolve({ source: "phb-2024", page: 95 })).toMatchObject({
      publication: "Player's Handbook (2024)",
      page: 95,
      openContent: false,
      license: null,
      consultedOn: "2026-10-16",
      consultedUrl: expect.stringContaining("5e.tools"),
    });
  });

  test("an unknown explicit source never falls back to open content", () => {
    expect(() => provenance.resolve({ source: "unknown" } as unknown as Provenance)).toThrow(
      "Unknown content source"
    );
  });
});
