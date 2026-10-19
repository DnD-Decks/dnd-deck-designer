import sourcesData from "../../data/provenance/sources.json" with { type: "json" };
import { lookup } from "../../lib/lookup.ts";

export type SourceId = "srd-5.2.1" | "phb-2024";
export type Provenance = { source: SourceId; page?: number; referenceUrl?: string };

type Source = {
  id: SourceId;
  publication: string;
  publisher: string;
  openContent: boolean;
  license: string | null;
  publicationUrl: string;
  consultedUrl?: string;
  consultedDataUrl?: string;
  consultedOn?: string;
  wording?: string;
  note?: string;
};

const sources = lookup({ items: sourcesData as Source[], key: "id", label: "content source" });

export const provenance = {
  resolve(origin?: Provenance) {
    const source = sources.get(origin?.source ?? "srd-5.2.1");
    return { ...source, page: origin?.page, referenceUrl: origin?.referenceUrl };
  },
};
