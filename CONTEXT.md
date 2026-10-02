# DBARENA

Public, comparable hosted-Postgres benchmark results, published as DBARENA.  

## Language

**DBARENA**:
The public brand for the open Postgres benchmark site.
_Avoid_: DB Arena, DB-Arena, DBarena, dashboard

**dbarena.com**:
The public website that publishes DBARENA Results: Home first, Comparison on drill-down.
_Avoid_: the dashboard, the playground

**Home**:
The first public page of dbarena.com. An editorial front: a lede, a Dataset readout, a rank chart across all sizes, and chapters by situation. Rank on Home is tpm per dollar (highest is 1st). Comparison is the drill-down from a chapter standing or “Compare this size”.
_Avoid_: field report, overview magazine, playground, dashboard, second Comparison, Leaderboard page

**Intensity**:
A Home chapter’s size switch: the situations in that chapter (for example Side project / Growing side project). It selects which standing the chapter shows. It is not a capacity plan and it does not count users.
_Avoid_: MAU, users, size quiz, SKU picker, slider, site-wide filter

**Dataset readout**:
The Home facts card that states the published corpus: how many Results, products, and through when. It is not a ranking of the current slice.
_Avoid_: live dataset, this-slice chart, mini Leaderboard, second ranking

**Standing**:
A Home chapter’s ranked list of products at one size, by tpm/$. From 2XLarge a product may have two Optimizations; the row is still one place. Chapters with those pairs have an I/O setup switch. Default is Cost optimized. Switching to Performance optimized shows that Result’s figures and re-ranks the visible size. Comparison is the drill-down from a standing row.
_Avoid_: Leaderboard as a site page, ledger, global peak ranking, matchup board, second row per Optimization

**Result**:
One published benchmark run for a provider, workload, and scenario, including summary, configuration, and raw samples.
_Avoid_: score, test

**Optimization**:
A published pair of Results for one product and size, differing in provisioned I/O performance: Cost optimized (tighter I/O, lower list price) or Performance optimized (higher I/O, higher list price). Two Optimizations are two Results, not two products. Comparison’s third control picks which one.
_Avoid_: Intensity, variant, SKU, second product

**New Orders/sec**:
The tpm of a Result shown per second (tpm ÷ 60). Same New Order throughput, not a second metric and not generic queries per second.
_Avoid_: QPS, queries per second, queries per minute

**Comparison**:
A side-by-side view of Results at `/compare`. Tiers may match or mix. Best is per metric, not once for the page. The live view is the address bar: `/compare?bound=&cols=<product>:<tier>[:<optimization>],...` (no as-of snapshot yet). Cost-optimized and performance-optimized Results share a product and size; the optional third token picks which one.
_Avoid_: vs, matchup, opaque share id

**Terminal clients**:
The highest concurrency in a Result’s sweep. Home and Comparison read each Result at that Result’s own terminal clients, even when those counts differ.
_Avoid_: latest clients, last tick, max clients, sweep position, hover, scrub, active clients, peak tpm as the rank

**Low vs median**:
The lowest New Order tpm during the terminal run, as a share of that run’s median. Home and Comparison show it per Result. Missing time samples means no figure.
_Avoid_: Held, stability, jitter, smoothed, rolling median

**Provider note**:
The leftover after tier matching: how this product is still unlike the others, said next to the Comparison. Site copy, not corpus. One optional `apps/web/content/notes/<product>.md`. Missing file means no column line; a known leftover cannot ship without a note.
_Avoid_: annotation, footnote, changelog note, reproducibility.notes (those are per-run provenance); notes inside `results/`

**Provider identity**:
A comparable column is an `index.json` `product` (fallback: the Result’s `product`, then `provider`) with ≥1 Result. The site loads each Result from that entry’s `path`. Display names are known product-slug labels, otherwise the slug. The mark follows the platform `provider` (Supabase Postgres and OrioleDB share the Supabase mark). Comparison leftover notes live in the web app, keyed by product slug.
_Avoid_: hardcoded provider union, coming-soon card

**Sponsor disclosure**:
The persistent header lockup next to the DBARENA wordmark that names Supabase as sponsor, plus a methodology sentence. It is ownership made obvious, not a claim of independence.
_Avoid_: independent benchmark, unbiased (we do not claim either)

**Signup attribution**:
The tagging of a Supabase signup, and later a sales deal, as having come via dbarena.com. Self-serve: “Start on Supabase” on the Supabase Comparison column. The Sponsor disclosure lockup is a separate tagged link.
_Avoid_: referral marketing, conversion tracking, `?ref=`

**Stealth preview**:
An unlisted, not-indexed live deploy of dbarena.com, shared privately, used internally before public launch. It shows only live Results.
_Avoid_: staging, beta (those imply a known URL and a product stage)

**Methodology page**:
The public `/methodology` page. Copy lives in repo markdown; leftover notes are site copy next to Comparison, not injected here. It states the 3-run protocol, does not invent a refresh cadence, and has a dedicated threats section. Home is not this page.
_Avoid_: field report

**Newsletter**:
The public-launch email list for DBARENA updates. Subscribe is email capture in the footer (compare and `/methodology`); Marketing owns the list and sender. No form on stealth. Not Supabase login.
_Avoid_: changelog, blog, auth-gated subscribe
