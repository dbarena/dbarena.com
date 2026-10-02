<!--
  Methodology page copy. Edit this file; the page layout stays in code.

  ## Heading {#id}     Jump-nav uses the id (Candidates, Workloads, …).
  > [!NOTE] Label      Callout. Use [!CAVEAT] for the warmer warning tone.
  `formula`            A paragraph that is only code renders as a formula chip.
  #### Heading         Consecutive h4s sit in a two-column grid. End the pair with ---.
  Provider logos       List items whose bold lead matches a provider name.
-->

# How we measure

Our methodology in detail.

Common Parameters

| Label | Value |
| --- | --- |
| Workload | Derived from TPC-C |
| Version | Postgres 17 |
| Connection | Direct TLS |
| Database | Platform Defaults |
| Iterations | 3 |
| Duration | 30 + 60 min |

## Benchmark candidates {#candidates}

We currently benchmark the following providers:

* **Supabase**
* **OrioleDB (Beta)**
* **Amazon RDS**
* **Google Cloud SQL, Enterprise edition**

We match hardware as closely as possible and use vCPU as the unit of scale. The vCPU:RAM ratio differs across providers; 1:4 and 1:8 are common. Specifically, we benchmark the combinations below.

| Tier | vCPU | RAM [GiB] | Supabase | RDS instance | GCP Cloud SQL instance |
| --- | ---: | ---: | --- | --- | --- |
| small | 2 | 2 | Small | db.t4g.small | N/A |
| medium | 2 | 4 | Medium | db.t4g.medium | db-custom-N4-2-4096 |
| large | 2 | 8 | Large | db.m9g.large | db-custom-N4-2-8192 |
| xlarge | 4 | 16 | XL | db.m9g.xlarge | db-custom-N4-4-16384 |
| 2xlarge | 8 | 32 | 2XL | db.m9g.2xlarge | db-custom-N4-8-32768 |
| 4xlarge | 16 | 64 | 4XL | db.m9g.4xlarge | db-custom-N4-16-65536 |
| 8xlarge | 32 | 128 | 8XL | db.m9g.8xlarge | db-custom-N4-32-131072 |

> [!NOTE] Amazon RDS
>
> On the `small` and `medium` tiers, AWS RDS only [supports burstable instance types](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.DBInstanceClass.Support.html), which we run in its default [Unlimited mode](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/burstable-performance-instances-unlimited-mode.html) configuration.


> [!NOTE] OrioleDB (Beta)
>
> OrioleDB (Beta) is Supabase Postgres with the OrioleDB storage engine rather than the default engine. It runs on the same compute sizes as default Supabase Postgres, so the Supabase column applies to both.

Because this benchmark compares providers rather than Postgres versions, we match the Postgres version as closely as possible. Postgres 17 is the newest version available on every tested platform, so we run the latest Postgres 17 release each provider offers. Exact versions are documented for each test point.

### Benchmark Candidate Setup

Benchmarks use each provider's default configuration except where explicitly stated. Clients connect directly to the database over TLS (`sslmode=require`) rather than through a pooler such as pgbouncer, because:

* The benchmark opens few enough connections that a pooler adds no value.
* TPC-C is a closed-loop benchmark and thus very sensitive to latency. Every extra component in the data path adds latency, shifts bottlenecks, and reduces achieved throughput. Keeping the setup simple removes noise and makes results simpler to interpret.

Future work may extend to more complex scenarios, such as introducing connection poolers and high availability components.

Where possible, we retain backups for at least seven days, as any production service would. Backups can affect both performance and price; [wal-g](https://wal-g.readthedocs.io/PostgreSQL/), for example, consumes extra system resources.

## Workloads {#workloads}

> [!NOTE] Disclaimer
> 
> This workload is derived from the TPC-C Benchmark and is not comparable to published TPC-C Benchmark results, as this implementation does not comply with all requirements of the TPC-C Benchmark.

We only use a workload derived from [TPC-C](https://www.tpc.org/tpcc/) for now but plan to add more workloads, such as workload derived from [TPC-E](https://www.tpc.org/tpce/).

### Workload Parameters

There are a few key parameters in a workload derived from TPC-C:

* `warehouses`, which controls the size of the data set (each warehouse occupies roughly 100 MB of disk space).
* `clients`, which controls concurrency and therefore the amount of load generated.
* think time: The TPC-C specification requires think times by default. In practice this leads to unrealistically high client counts (several tens of thousands of clients) so we run unthrottled.

We target two scenarios: one where the data set fits into the Postgres buffer cache (`cache fit`), and one where it does not (`cache exceeding`). The sizing of each follows below.

### Cache Fit

We size the data set from calibration runs, measuring cache hit ratio from Postgres' perspective: `blks_hit / (blks_hit + blks_read)` from `pg_stat_database`. A miss in shared buffers may still hit the filesystem page cache. Calibration varied warehouses from 2 to 8 per GiB of RAM. For example: a 16 GiB machine ran 32 to 128 warehouses, or 3.2 GB to 12.8 GB on disk. We load the data set, do a 30 minute warmup. For cache fit we target at least 99% hits during a 5 minute calibration run (after the 30 minute warmup), which we treat as a signal that the active set is being served from memory. Based on these calibration results, we settled on the formula:

`warehouses = 2 * RAM in GiB`

We scale test points based on tier and match the tier on vCPU count. Keep in mind that vCPU:RAM ratios can vary across providers (common ones are 1:4 or 1:8) so some providers might have an edge based on their RAM ratio.

The storage settings below apply to `cache fit` only.

The following parameters deviate from the providers' defaults:

* **Disk size:** we grow the disk size with the expected database size (+ headroom).
* **IOPS and disk throughput:** WAL is I/O intensive, so provider defaults would artificially limit the results so we raise both.

Especially on larger tiers we observed significant performance differences between providers. Instead of forcing one disk configuration, we have benchmarked two variations so users can pick whatever scenario serves their purposes:

* **Performance-optimized:** we provision higher IOPS and disk throughput at the expense of incurring higher costs. This allows us to gauge what the provider can achieve at this tier when given enough resources.
* **Cost-optimized:** we provision lower IOPS and disk throughput at the expense of leaving some performance on the table. This allows us to gauge what the provider can achieve in a more disk-constrained scenario.

Where one aligned configuration was practical, we ran only that. We align configurations across providers as far as the platforms allow. The exceptions are listed under Storage Constraints below.

### Cache Exceeding

We size the number of warehouses so the data set takes up 4 times the size of RAM to provoke churn in the shared buffer pool. As each warehouse occupies roughly 100 MB, this means we size `warehouses = 40 * RAM in GiB`. We match IOPS across providers. Disk size and throughput are matched wherever the platforms allow it (see Storage Constraints below).

### Storage Constraints

Two platform constraints prevent exact alignment in some scenarios:

* **GCP:** [the lowest disk throughput Cloud SQL accepts is 140 MiB/s](https://docs.cloud.google.com/sql/docs/postgres/storage-options-overview), slightly above the 125 MiB/s gp3 default elsewhere.
* **AWS RDS:** [gp3 volumes below 400 GiB are fixed at 3,000 IOPS and 125 MiB/s](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_Storage.html#gp3-storage). At 400 GiB and above, RDS stripes across four volumes and the baseline becomes 12,000 IOPS and 500 MiB/s, which is also the minimum that can be provisioned at that size. Configurations between those two points do not exist on RDS.

Where a target configuration is not constructible on RDS, we run the nearest one that is:

| Scenario | All other providers | RDS |
| --- | --- | --- |
| cache exceeding, xlarge | 128 GB, 12,000 IOPS, 149 MiB/s | 400 GB, 12,000 IOPS, 500 MiB/s |
| cache exceeding, 2xlarge | 256 GB, 12,000 IOPS, 297 MiB/s | 400 GB, 12,000 IOPS, 500 MiB/s |
| cache fit, 2xlarge | 64 GB, 12,000 IOPS, 300 MiB/s | 400 GB, 12,000 IOPS, 500 MiB/s |
| cache fit, 4xlarge and 8xlarge, both variants | 128 or 256 GB, IOPS and throughput matched | 400 GB, IOPS and throughput matched |

The published price of each test point reflects what was actually provisioned. Every test point's `result.json` records the exact configuration in its `instance` block.

### Concurrency

We vary clients from 1 times up to 6 times, and on the two largest tiers up to 8 times, the available vCPU to gauge scalability. Published figures use the peak concurrency of each test point (see Execution below):

| Tier    | Scenario        | vCPU | RAM [GiB] | Warehouses | Clients          |
| ------- | --------------- | ---: | --------: | ---------: | ---------------- |
| small   | cache exceeding |    2 |         2 |         80 | 2, 4, 8, 12      |
| small   | cache fit       |    2 |         2 |          4 | 2, 4, 8, 12      |
| medium  | cache exceeding |    2 |         4 |        160 | 2, 4, 8, 12      |
| medium  | cache fit       |    2 |         4 |          8 | 2, 4, 8, 12      |
| large   | cache exceeding |    2 |         8 |        320 | 2, 4, 8, 12      |
| large   | cache fit       |    2 |         8 |         16 | 2, 4, 8, 12      |
| xlarge  | cache exceeding |    4 |        16 |        640 | 4, 8, 16, 24     |
| xlarge  | cache fit       |    4 |        16 |         32 | 4, 8, 16, 24     |
| 2xlarge | cache exceeding |    8 |        32 |       1280 | 8, 16, 24, 48    |
| 2xlarge | cache fit       |    8 |        32 |         64 | 8, 16, 24, 48    |
| 4xlarge | cache exceeding |   16 |        64 |       2560 | 16, 32, 64, 128  |
| 4xlarge | cache fit       |   16 |        64 |        128 | 16, 32, 64, 128  |
| 8xlarge | cache exceeding |   32 |       128 |       5120 | 32, 64, 128, 256 |
| 8xlarge | cache fit       |   32 |       128 |        256 | 32, 64, 128, 256 |

## Key metrics {#metrics}

We provide two key metrics:

* `tpm`, average throughput in transactions per minute over the 60-minute measurement run; higher is better.
* `tpm/$/month`, price-performance. Prices are the publicly stated list prices for on-demand instances per provider. No discounts are considered. One month is calculated as 730 hours.

The `p95` appears as a supporting metric next to them on the Home and Compare pages. `p95` is the "New Order" transaction latency: 19 of 20 transactions complete at or below this value.

## Execution {#execution}

**Definitions:** A *test point* is one combination of tier, scenario, provider and disk configuration, for example `cache-fit-large`. An *environment* is one freshly provisioned database together with its load generator.

### Tooling

[`benchctl`](https://github.com/dbarena/benchctl) runs each benchmark and [`dbarenactl`](https://github.com/dbarena/dbarenactl) schedules and tracks individual runs. The load generator is [Supabase's fork of go-tpc](https://github.com/supabase/go-tpc/) which contains several improvements and bug fixes that the unmaintained upstream repo lacks.

### Experiment Setup

Databases are created in the following regions:

| Provider | Region | Comment |
| --- | --- | --- |
| AWS | us-east-1 | AWS "default" region |
| GCP | us-east1 | Common region in GCP with more available capacity than `us-central1` and identical pricing. |

After the initial data load, we run a 30-minute warmup (discarded), and then measure for 60 minutes.

Each benchmark is repeated, in a fresh environment, until there are 3 successful runs. If any part of a run aborts with an error (e.g. network issue), the whole run is discarded and repeated. In each run we increase client count (see above). For reporting metrics we first take the median tpm of the three runs at each client count. The client count with the highest median tpm is the peak concurrency of the test point. We pick the run with the median tpm at peak concurrency.

Runs do not always reach their highest tpm at the same client count. Taking the median at each client count first means that all reported figures us a consistent client count.

Example:

We benchmark the test point `cache-exceeding-xlarge`. For this test point we run with 4, 8, 16 and 24 clients (see table above). Suppose the three runs reach:

| Clients | run 1 | run 2 | run 3 | median |
| ------: | ----: | ----: | ----: | -----: |
|       4 |  9302 |  9395 | 10948 |   9395 |
|       8 | 15529 | 14846 | 16300 |  15529 |
|      16 | 18085 | 16200 | 11852 |  16200 |
|      24 |  7647 |  7228 |  8079 |   7647 |

Runs 1 and 2 reach their highest tpm at 16 clients, run 3 at 8 clients. The median is highest at 16 clients, so the peak concurrency is 16 clients. At 16 clients the median value is 16200, so we pick **run 2** at 16 clients for reporting all results from this test point.

This selection only determines what we present on this website. Each raw result, that we also publish, records the tpm of every run at every client count, so you can apply a different selection rule to the raw data.

### Load Generator Machine

To keep the load generator from becoming the bottleneck, we match the target's vCPU count and never allocate fewer than 4 vCPU. Specifically:

| Tier | AWS Instance Type | GCP Instance Type |
| --- | --- | --- |
| Small | c8gd.xlarge | c4a-standard-4 |
| Medium | c8gd.xlarge | c4a-standard-4 |
| Large | c8gd.xlarge | c4a-standard-4 |
| XL | c8gd.xlarge | c4a-standard-4 |
| 2XL | c8gd.2xlarge | c4a-standard-8 |
| 4XL | c8gd.4xlarge | c4a-standard-16 |
| 8XL | c8gd.8xlarge | c4a-standard-32 |

When capacity is unavailable it is permissible to pick a larger instance from the same family (e.g. `c8gd.4xlarge` instead of `c8gd.2xlarge`). Other changes are not permitted.

The load generator machine is always placed in the same region as the database. `benchctl` tunes the machine to reduce system-level noise.

On AWS and GCP we place the load generator in the same zone and subnet as the database. On Supabase the zone is not selectable, so the load generator only shares the region. We therefore measure the roundtrip latency at the beginning of each benchmark to gauge the influence of placement.

## Limitations {#limitations}

We want to callout the limitations of this benchmark in one place although you may find this information in various places of this page:

* **Single workload:** We only run a workload derived from TPC-C but support for more workloads is planned.
* **Throughput-oriented benchmark:** We disable client think time to generate enough load for modern systems with a reasonable number of clients (see Workload Parameters above), which makes this a throughput-oriented benchmark.
* **Single region per cloud.** AWS results are measured in us-east-1, GCP results in us-east1. We do not test cross-region latency, scenarios with replicas, or any other region.
* **List price only:** As a lowest common denominator we use each provider's public on-demand list price to calculate price-performance. Depending on your own discounts, the ranking of providers might change.
* **vCPU:RAM ratio:** We match vCPU count across providers, not RAM (see Benchmark candidates above). Providers offering a 1:8 vCPU:RAM ratio will have an edge.
* **Load generator placement:** On AWS and GCP the load generator runs in the same zone as the database. On Supabase the zone is not selectable, so it only shares the region. We measure network round-trip latency at the start of each run to gauge the impact.
* **Median of three runs:** We only publish detailed results for the run with the median tpm score at peak concurrency (see Execution above). The raw published data contain the tpm of every run at every client count. We use this restriction to keep benchmarking effort reasonable (all benchmarks across all currently supported providers result in more than 750 individual benchmarks).

## Reproduction {#reproduction}

To reproduce the experiments, you need to meet the following prerequisites:

* An account for the provider that you want to benchmark.
* The [dbarenactl](https://github.com/dbarena/dbarenactl) and [benchctl](https://github.com/dbarena/benchctl) repositories checked out locally.
* Both tools set up properly (see their respective README files).

### Reproducing a single test point

To reproduce a single test point, e.g. `cache-exceeding` for the `xlarge` tier, invoke `dbarenactl` as follows:

```
# will print a "sweep id" required later
dbarenactl run --candidate candidates/aws/rds/tpcc/manifest.yaml \
               --test-point xlarge/cache-exceeding
# optional, only needed once if pricing data are needed
dbarenactl pricing fetch --candidate candidates/aws-rds-tpcc.yaml
# use `--force` if you ran less than 3 iterations to still write results
dbarenactl results $SWEEP_ID --force --dest=~/my-test-results
```

> [!NOTE] Tip
>
> The raw result file documents the basic [dbarenactl command to invoke](https://github.com/dbarena/dbarena.com/blob/main/results/aws/rds/tpcc/cache-exceeding-xlarge/result.json#L30) but you should also specify `--iterations=3` and optionally `--max-concurrency=3` to launch all benchmark environments at once instead of running each benchmark one after the other.

### Reproducing all results for a provider

This is similar to the example before, except that you need to drop the `--test-point` parameter.

```
# will print a "sweep id" required later
# adjust --max-concurrency as needed.
# dbarenactl will run up to 15 environments at once
dbarenactl run --candidate candidates/aws/rds/tpcc/manifest.yaml \
               --iterations=3 \
               --max-concurrency=15
# fetch most recent price list, only needed once, not for every new sweep
dbarenactl pricing fetch --candidate candidates/aws-rds-tpcc.yaml
# if you did not run with --iterations=3, add --force.
dbarenactl results $SWEEP_ID --dest=~/my-test-results
```
