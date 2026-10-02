# Contributing to dbarena

dbarena publishes public, comparable benchmark results for hosted Postgres
providers. This guide covers contributing benchmark **results**. For changes
to the website itself, see `apps/web/README.md`.

## Ways to contribute

* **Report methodology issues**: Raise a ticket in this repo to discuss our
  [benchmark methodology](apps/web/content/methodology.md).
* **Report tooling issues**: bugs or feature requests for the CLIs that
  produce results belong in their own repos (see below), not here.
* **Fix or refresh existing results**: correct metadata, update pricing, or
  re-run a scenario whose numbers are out of date.
* **Add new results**>: cover a new provider, product, workload, or tier. Note
  that adding new workloads requires very intensive prior testing. Similarly, 
  adding a new provider requires code changes across multiple repositories. So
  if you plan to work on any of these, please raise an issue first to discuss.
  We will not accept pull requests that do not demonstrate the required rigor.

## Quick start

Two open-source CLI tools are required to create results:

- **[benchctl](https://github.com/dbarena/benchctl)** is the benchmark harness
  that runs one benchmark scenario against one target database: it provisions
  the benchmark environment and runs the workload.
- **[dbarenactl](https://github.com/dbarena/dbarenactl)** orchestrates a full
  sweep, consisting of many test points. A YAML manifest descibes the test points
  consisting of provider and other meta data as well as the actual configuration.
  It drives `benchctl` for each test point, and assembles the `result.json` files
  in the format that this repo expects.

### 1. Install

Both tools build with [mise](https://mise.jdx.dev):

```bash
# benchctl (also needs OpenTofu: brew install opentofu)
git clone https://github.com/dbarena/benchctl.git
cd benchctl
mise trust
mise run build
source scripts/use.sh   # puts benchctl on PATH for this shell

# dbarenactl
git clone https://github.com/dbarena/dbarenactl.git
cd dbarenactl
mise trust
mise run build
source scripts/use.sh   # puts dbarenactl on PATH for this shell
```

Some scenarios need cloud credentials (e.g. AWS or GCP) or additional tools installed
locally. Please check the respective README files of these tools to set them up.

### 2. Run an example sweep

A **candidate manifest** is a YAML file naming the provider, product,
workload, and the test points. See `dbarenactl`'s `candidates/`
directory for examples.

```bash
# Preview what a sweep would do, without touching anything
dbarenactl run --candidate candidates/aws-rds-tpcc.yaml --dry-run

# Run a sweep. Our methodology requires to run 3 iterations per test point
dbarenactl run --candidate candidates/aws-rds-tpcc.yaml --iterations 3

# Check progress
dbarenactl status <sweep-id>
```

Once a sweep has finished, ensure to fetch fresh pricing data (omit if
no pricing data are available for a provider):

```bash
dbarenactl pricing fetch --candidate candidates/aws-rds-tpcc.yaml
```

then, assemble the results files:


```bash
dbarenactl results <sweep-id> --dest /path/to/dbarena
```

This writes one `result.json` (plus raw timeseries CSV files) per test point
to `results/<provider>/<product>/<workload>/<scenario>/`, and updates
`results/index.json` accordingly.

## Submitting results

* Always generate result files via `dbarenactl` to ensure they are in the
  expected format.
* Only publish on-demand list pricing. This is the case as long as prices
  are fetched via `dbarenactl pricing fetch`.
* Open a PR with the new or changed files under `results/`.

## Getting help

* If you have problems with the CLIs themselves, open an issue on
  [dbarena/benchctl](https://github.com/dbarena/benchctl) or
  [dbarena/dbarenactl](https://github.com/dbarena/dbarenactl).
* For questions about a specific result, scenario, or schema field, open an
  issue in this repo.
