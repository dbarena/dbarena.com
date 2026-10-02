# Homepage content

`buildHomeData()` reads the published benchmark catalog (via `getBenchmarks()`
on the homepage) and derives counts, dates, product rows, comparison links,
ranks, hero lead changes, and chapter result summaries from that catalog.
Do not hard-code a named product as the winner or the comparison baseline.

## Publishing new results or products

Add the result files and their entries to `results/index.json` using the existing
schema. The result's product slug identifies the compared product; its provider
identifies the host. Multiple products can share a host. Unknown product slugs
get a readable fallback name and generic logo. Brand-specific
spelling, descriptions, and logos can optionally be added to the catalog and
logo component; homepage prose does not need editing.

The homepage is statically generated. Production requires a new build/deploy
to publish catalog changes. The file-backed catalog is also process-cached:
restart the development server after editing result files. This is data-driven
publishing, not a live API or polling feed.

## Intentional editorial configuration

Mission/sponsorship copy, methodology, workload definitions, tier definitions,
and the Side project / Production / Heavy load grouping remain authored policy.
So are `WHY_COPY`, `PROTOCOL_LINES`, and `NOT_MEASURED` (Behind the results),
`CLEAN_RUNS`/`STATS_FOOTNOTE` (hero proof strip) in `home-copy.ts`, and the
static items in `FAQ_COPY` (`faq-copy.ts`, the "how often do results update"
answer is derived — see `faq-dates.ts`): each restates a documented rule of
the protocol, and none can be derived from a result file. If the protocol
changes, edit these.

Everything else on the marketing sections is derived, except the approved hero
headline, "OrioleDB offers superior price performance." The hero chart and
legend use cache-exceeding results; its standings come from `overallStandings()`
and report ties as shared first place;
the hero proof strip counts the catalog; the Price and latency table
(`price-latency.tsx`) reads a published row at the selected size, including
its real result path. `tests/home-copy-neutrality.test.mjs`
fails the build if any file under this directory names a product, with two
documented exemptions: sponsorship disclosure and the brand-spelling table.
If the actual benchmark protocol or supported tiers change, update that
configuration; results alone cannot establish a new methodology or explain
the cause of a performance change.

Overall standing counts first-place finishes, then second and third, with shared
positions for equal records. This remains the same rule for additional products.
Per-size ranks compare priced results and share positions for equal values.
Absent prices do not earn a plotted value rank. Headlines scope incomplete
ranges explicitly, and I/O copy does not infer changes to disk configuration.

Run regression checks with `node --test tests/home-*.test.mjs` from `apps/web`.
