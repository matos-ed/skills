# Local verification — mandatory for every backend task

Every task that changes runtime code ends with the service **running locally against local infra** (MongoDB, Kafka, Redis when used), its most-used endpoints exercised end to end, and the responses compared **A/B against the base branch**. Jest/Supertest suites do not replace this: they mock Kafka and external services, run on an ephemeral Mongo without Atlas Search, and never boot the real `server.ts`.

Skip only when the change has no runtime effect (docs, CI config, comments). Say explicitly that it was skipped and why.

**Run it with the `local-testing` skill.** It keeps a profile per project (infra, topics, synthetic env, seeds, scenarios, gotchas), reuses the containers between runs and adds MinIO for S3. The rules below still apply; the profile is where each project's details live.

## Hard rules

- **Nothing points at STG/PRD.** `dotenv` loads `./environments/.env` relative to the **cwd**. Run each build from its own directory with its own `environments/.env`, so the repo `.env` (STG values) is never read. Set every key the service reads (`src/configurations/env-constants.ts`).
- **No copied data.** Copying STG/PRD documents is PII and gets denied. Seed synthetic documents only. Include at least one **legacy document inserted through the raw driver**, shaped like production data before the change.
- **Third parties go to a local HTTP stub**: api-geral, data-enrichment, communication, places, Google, ViaCEP and similar.
  - Hosts that come from env vars: point the env var at the stub.
  - Hosts hardcoded in the code: use `scripts/preload-rewrite.js` (`node -r`), which rewrites qd-packages `HttpClient` paths.
  - The stub logs every call, so you can assert which integrations ran.

## Steps

1. **Infra** — `scripts/local-infra.sh up` starts:
   - MongoDB **Atlas Local** on `27027`, which supports `$search`. Connect with `?directConnection=true`.
   - Kafka on `19093` with **SASL_SSL** and SASL PLAIN user `local`/`local`. qd-packages hardcodes `ssl: true` + SASL PLAIN, so a plaintext broker does not work.
   - Redis on `6390` with `WITH_REDIS=1`.

   Then create every topic the service produces or consumes with `scripts/local-infra.sh topics T1 T2 …`. Find them by grepping `topic:`, `_TOPIC` and `QD-…`. qd-packages analytics writes to `RECORD_ANALYTICS_TOPIC`. Do not rely on auto-create.
2. **Builds** — build the base in a worktree: `git worktree add --detach <dir>/base origin/stage`. When `package.json` and the lockfile are identical, symlink `node_modules`.
   - If the base moved since the branch was cut, test **what will land**, not the raw branch. Make a second worktree at `origin/stage` and run `git merge --no-commit origin/<branch>` there. Otherwise the diff mixes in changes other PRs already merged.
   - Otherwise build the branch in the repo with `yarn build`.
   - Also run the Jest suites on that tree.
3. **Run dirs** — one per build, each with its own `environments/.env`, port and `DB_NAME`.
   - Start with `NODE_EXTRA_CA_CERTS=<dir>/certs/cert.pem node -r scripts/preload-rewrite.js dist/src/server.js`. `NODE_EXTRA_CA_CERTS` keeps TLS verification on.
   - Confirm in the logs that `Producer Connected` and `Consumer Connected` appear, and that the group is `Stable` (`kafka-consumer-groups.sh --describe --state`).
4. **Seed** — the same synthetic data in both DBs. Atlas Search indexes are usually not versioned: infer the definition from the `$search` query, create it with `db.command({ createSearchIndexes })`, and state that it is inferred. Before querying, wait until `$listSearchIndexes` reports `queryable`.
5. **Scenario** — choose the most-used endpoints.
   - If Grafana is available, take them from Mimir span metrics (`traces_span_metrics_calls_total{span_kind="SPAN_KIND_SERVER"}` by `service_name, span_name`).
   - Otherwise cover the main user flow plus the back-office panel flow.
   - Run against both builds. Record status and body for each call, plus the resulting documents.
   - Compare with `scripts/ab-diff.js`, which normalizes ids, dates, JWTs and signed URLs.
   - **Empty vs empty is not evidence.** Check that list/search results actually contain data before trusting a zero diff.
6. **Kafka**
   - Record offsets per topic (`kafka-get-offsets.sh`) before and after each run, so both builds produce the same messages.
   - Test consumers on the branch build alone. Both builds share the `groupId` and split partitions, so stop the base first.
   - Produce **with a key** (`--property parse.key=true --property key.separator='|'`). See Gotchas.
7. **Report** — include:
   - a table of endpoint × status (branch vs base);
   - the diffs found;
   - Kafka messages per topic;
   - consumer side effects;
   - what was stubbed;
   - what was **not** covered.
8. **Teardown** — stop the node processes, run `git worktree remove <dir>/base`, then `scripts/local-infra.sh down`.

## Gotchas (seen in practice)

- **The qd-packages 5.x consumer crashes on a message with a null key** (`messageBuffer.key.toString()`). The crash handler then SIGTERMs the whole process. With `isFromBeginning: true` and no committed offset, a restart re-reads the same message and crashes again. Recover with `kafka-consumer-groups.sh --reset-offsets --to-latest --topic <T> --execute`, using explicit topics (`--all-topics` ignores groups without commits).
- `$search` fails on Community Mongo with "only allowed on MongoDB Atlas". Use Atlas Local.
- `$match` filters after `$search` (step, city) can legitimately hide the documents your scenario created. Search for a seeded document that passes the filter.
- Mongoose schema defaults only apply to documents created through the model. Many services write through the raw driver (`MongoRepository`) or `updateOne`, so a `default` does not reach the database. Assert on the stored document, not the schema.
- The Kafka `GroupCoordinator`/`Metadata` errors on first boot are transient while `__consumer_offsets` and the topics get created. Persistent `Metadata` errors mean a topic is missing.
- **Stubs must match what the service actually sends, not what the test input looks like.** Example: the geocoding service lowercases and strips accents before calling Google, so a case-sensitive stub rule silently answered the wrong branch.
  - When a result surprises you, read the stub's call log before you blame the code.
  - Give the stub toggles (`/__google-zero?on=1`) to force rare paths instead of crafting inputs.
- Stop local processes by port (`kill $(lsof -ti tcp:<ports>)`). `pkill -f` misses processes that were started with a relative path.
- Docker amd64 on Apple Silicon distorts Node timing and memory. Run the node processes natively, and keep only the infra in containers.
