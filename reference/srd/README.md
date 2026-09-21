# SRD 5.2.1 — Audit Ground-Truth

## Files

| File | Purpose |
|------|---------|
| `SRD_CC_v5.2.1.pdf` | **Authoritative source.** Verbatim official PDF from Wizards of the Coast (CC-BY-4.0). Never edited. |
| `SRD_5.2.1.md` | Grep/diff index. Machine-extracted from the PDF via `pymupdf4llm`. On any discrepancy the **PDF wins**. |
| `LICENSE` | CC-BY-4.0 attribution statement required by the license. |

## Scope — SRD only, not the PHB

This directory contains **SRD content only**. The SRD 5.2.1 covers a subset of spells, classes,
and items from the 2024 Player's Handbook. Full PHB content is not CC-licensed and is not committed
here.

Any data in `src/data/` that goes beyond the SRD is author-original and fine to include. Only
SRD-derived data needs this reference for audit purposes.

## Why it's here

The card data in `src/data/` (spells, class features, resources, weapon masteries) is audited
against this reference — names, schools, levels and rules text must be faithful to the SRD. The
`/asset` skill builds its card inventory straight from `src/data/`, so the data has to be right
first. See issue #12 and the asset-pipeline epic #19.

## Re-extracting the markdown

If the PDF is updated, re-run:

```sh
python3 -m pip install --user pymupdf4llm
python3 -c "
import pymupdf4llm, pathlib
text = pymupdf4llm.to_markdown('reference/srd/SRD_CC_v5.2.1.pdf')
pathlib.Path('reference/srd/SRD_5.2.1.md').write_text(text, encoding='utf-8')
"
```
