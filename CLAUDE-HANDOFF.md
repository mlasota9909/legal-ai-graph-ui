# CLAUDE-HANDOFF — UI Codex action run

## Date

2026-06-30

## Scope

UI chat action batches for review items U1, U2, U4, and U3 source honesty:

- U1/U2: remove browser-facing `source_uri` use and normalize GraphRAG query source badges after backend contract v0.2.5/v0.2.6.
- U4: add doc-scoped stale response guards for activity, summary, and pipeline state in `useWorkspace`.
- U3: fix Atrium list source derivation, add Lattice KPI/agreement field source metadata, make DocumentPicker fallback counts non-real/unavailable when `/api/status` lacks `graph_counts`, and stop augmentation provider rows from falling back to seed counts when source keys are omitted.
- U5: mark legacy static lawyer trace/upload seams unavailable instead of calling `/trace` or `/api/upload`.
- U7/MAC-49: harden EvidencePanel seed and graph fallback safety without fabricating graph data.
- MAC-51: make live EvidencePanel Playwright tests discover document, namespace, and graph seed dynamically.
- MAC-52: classify and harden the live AskPanel query timeout path, including Core typed degraded responses and completed empty real responses.

Pre-existing dirty files before the MAC-52 continuation: untracked `.vite/` only. It remains untracked and was not committed.

## Docs read

- `/home/mlasota/legal-ai-coord/VISION.md`
- `/home/mlasota/legal-ai-coord/REVIEW-architect.md`
- `/home/mlasota/legal-ai-coord/WORKER-METHODOLOGY.md`
- `/home/mlasota/legal-ai-coord/LDR-HOWTO.md`
- `/home/mlasota/legal-ai-coord/BRIDGE.md`
- `/home/mlasota/legal-ai-graph-ui/REVIEW-ui.md`
- `/home/mlasota/legal-ai-graph-ui/CLAUDE.md`
- `/home/mlasota/legal-ai-graph-ui/README.md`
- `/home/mlasota/legal-ai-graph/documentation/UI-DATA-CONTRACT.md`
- `/home/mlasota/legal-ai-graph/BRIDGE.md`

Missing/nonexistent when checked: `CODE-REVIEW-BRIEF.md`, `AGENTS.md`, `.codex/WORKLOG.md`, coord `CLAUDE.md`. Claude config files were scouted only for operating/tooling metadata; no secrets were copied.

## Review findings actioned

- U1 actioned: removed `source_uri` from `RegisterProvenance` and the local claim-detail provenance type. UI still displays safe page/chunk references only.
- U2 actioned: SPA AskPanel and static lawyer chat now map `data_source` through `real | simulated | mock`, with compatibility for `retrieved_evidence`/`answer_basis="retrieved_evidence"` as real.
- U4 actioned: `useWorkspace` now aborts/cancels doc-scoped activity, summary, and pipeline fetches; checks returned `document_id`; and clears stale doc-scoped state on document switch.
- U3 actioned in part: Atrium list artifact header source badge now follows active chronology/entity/people row provenance.
- U3 actioned in part: Lattice claims/conflicts/human-queue KPI cells and agreement columns now use field-level source metadata instead of hardcoded/global source badges.
- U3 actioned in part: DocumentPicker `/api/status` fallback no longer badges fabricated zero claim counts as real.
- U3 actioned in part: Atrium and Lattice augmentation provider rows now use only `graph_counts.external_sources_by_source`; omitted keys render as `unavailable` with a mock badge.
- U5 actioned in part: static lawyer trace debug and upload controls now show unavailable copy and no longer call legacy `/trace` or `/api/upload` endpoints.
- U7 actioned: EvidencePanel now shows explicit unavailable states for missing namespace, missing seed/provenance, non-OK graph endpoint responses, and empty graph responses.
- U7 actioned: graph source badges use the shared source taxonomy, so unknown future graph `data_source` values display as `unknown source state`, not mock.
- U7 actioned: `useWorkspace` clears stale graph namespace on document switches and when status responses do not contain a usable namespace.
- MAC-51 actioned: live EvidencePanel tests now discover candidate documents from `/api/status`, read `graph_namespace` from `/api/status/{docId}`, resolve the UI-equivalent register provenance seed, and preflight `/api/graph` before navigating through the live UI path.
- MAC-51 actioned: live EvidencePanel tests skip with an explicit backend-unavailable/no-usable-seed reason when the live tier cannot run, while mocked fallback tests remain backend-independent.
- MAC-52 actioned: live AskPanel tests now discover a live query document from Core, assert request dispatch separately from response arrival, and fail with a backend-latency classification if `/api/query` does not respond within the live-query threshold.
- MAC-52 actioned: AskPanel now treats Core `validation_status="empty"` as an explicit `No answer` state instead of a supported answer, without fabricating answer text or citations.

## Files changed

- `src/types/contracts.ts`
- `src/hooks/useWorkspace.ts`
- `src/components/atrium/AtriumDashboard.tsx`
- `src/components/lattice/LatticeDashboard.tsx`
- `src/components/query/AskPanel.tsx`
- `src/components/evidence/EvidencePanel.tsx`
- `static/lawyer-app.jsx`
- `static/lawyer.html`
- `src/__tests__/crossscreen.spec.ts`
- `REVIEW-ui.md`
- `CLAUDE-HANDOFF.md`
- `/home/mlasota/legal-ai-coord/BRIDGE.md`
- `CLAUDE.md`

## API/contract assumptions

- Consumed backend contract v0.2.5/v0.2.6.
- Public provenance is path-safe; raw `source_uri` is server-only and should not appear in public API/UI responses.
- `/api/query` returns `data_source="real"` for evidence-backed GraphRAG answers and may include `answer_basis="retrieved_evidence"`.
- `/api/status/{docId}` exposes real `graph_counts.data_source` and `kpi_metrics.*_data_source` for the fields now badged as real.
- Normal Ask sends `document_id` by default; raw namespace is only a transitional fallback when no document id is available. `pack_id` remains an Architect/Core decision if the public scope changes again.

## BRIDGE updates

- Added 2026-06-29 UI acknowledgement that `source_uri` redaction and query badge taxonomy were consumed.
- Added 2026-06-29 UI acknowledgement that field-source metadata was consumed and noted repeat local backend daemon exits with Ray GCS failure during long full-suite runs.
- Added 2026-06-29 UI acknowledgement that augmentation omitted provider keys now display unavailable/mock unless Core returns explicit zero keys.

## Linear updates

- Created `MAC-35` (`[UI] Review action: remove source_uri and normalize query source badges`) under `MAC-16`, label `ui`, status `Done`.
- Created `MAC-36` (`[UI] Review action: guard doc-scoped async responses`) under `MAC-16`, label `ui`, status `Done`.
- Created `MAC-37` (`[UI] Review action: fix Atrium list source badge derivation`) under `MAC-16`, label `ui`, status `Done`.
- Created `MAC-38` (`[UI] Review action: make Lattice and pack picker source badges field-accurate`) under `MAC-16`, label `ui`, status `Done`.
- Created `MAC-39` (`[UI] Review action: stop inventing augmentation provider counts`) under `MAC-16`, label `ui`, status `Done`.
- Created `MAC-48` (`[UI] Static lawyer app marks legacy trace/upload seams unavailable`) under `MAC-16`, label `ui`, status `Done`.
- Updated `MAC-49` (`UI EvidencePanel seed and graph fallback safety`), label `ui`, status `Done`.
- Created successor `MAC-51` (`[UI] Discover live EvidencePanel test document and seed dynamically`), label `ui`, status `Todo`, related to `MAC-49`.
- Updated `MAC-51` (`[UI] Discover live EvidencePanel test document and seed dynamically`), label `ui`, status `Done`.
- Updated `MAC-52` (`[UI] Classify and harden live AskPanel query Playwright timeout`), label `ui`, status `Done`.

## Tests run

- `npx tsc --noEmit`: pass.
- `rg -n "source_uri" src static`: no matches.
- `npm run build`: pass.
- Opencode local worker ran `npx playwright test src/__tests__/crossscreen.spec.ts -g 'stale summary response cannot overwrite selected document' --reporter=line`: pass.
- Opencode local worker ran `npx playwright test src/__tests__/crossscreen.spec.ts -g 'atrium list artifact source badge follows real active rows' --reporter=line`: pass.
- Opencode local worker ran `npx playwright test src/__tests__/crossscreen.spec.ts -g 'document picker fallback does not badge fabricated zero counts as real' --reporter=line`: pass.
- `npx playwright test src/__tests__/crossscreen.spec.ts -g 'lattice KPI and agreement source badges follow backend fields|document picker fallback does not badge fabricated zero counts as real|atrium list artifact source badge follows real active rows|stale summary response cannot overwrite selected document' --reporter=line`: pass, 4/4.
- `npx playwright test src/__tests__/crossscreen.spec.ts --grep-invert 'AskPanel returns an answer with citations' --reporter=line`: pass, 23/23.
- Direct `/api/query` curl probe: HTTP 200, `data_source="real"`, `answer_basis="retrieved_evidence"`.
- `npx playwright test src/__tests__/crossscreen.spec.ts -g 'AskPanel returns an answer with citations' --reporter=line`: pass after backend restart.
- `npx playwright test src/__tests__/crossscreen.spec.ts --reporter=line`: attempted full 24-test final run, interrupted after backend API process exited with Ray GCS failure; partial result 10 passed, 6 failed real-doc setup timeouts, 1 interrupted, 7 did not run.
- `npx playwright test src/__tests__/crossscreen.spec.ts -g 'atrium augmentation provider rows do not invent omitted source counts|lattice KPI and agreement source badges follow backend fields' --reporter=line`: pass, 2/2.
- Opencode local worker ran `npx playwright test src/__tests__/crossscreen.spec.ts -g 'atrium augmentation provider rows do not invent omitted source counts' --reporter=line`: pass.
- `PLAYWRIGHT_PORT=5183 PLAYWRIGHT_REUSE_EXISTING_SERVER=false npx playwright test src/__tests__/crossscreen.spec.ts --grep "static lawyer legacy trace and upload seams are unavailable" --reporter=line`: pass.
- `PLAYWRIGHT_PORT=5183 PLAYWRIGHT_REUSE_EXISTING_SERVER=false npx playwright test src/__tests__/crossscreen.spec.ts --grep "static lawyer (legacy trace and upload seams are unavailable|app loads matter list|chat handles query_backend_unavailable)" --reporter=line`: pass, 3/3.
- `PLAYWRIGHT_PORT=5184 PLAYWRIGHT_REUSE_EXISTING_SERVER=false npx playwright test src/__tests__/crossscreen.spec.ts --grep "EvidencePanel graph fallback|unknown graph source" --reporter=line`: pass, 5/5.
- `PLAYWRIGHT_PORT=5185 PLAYWRIGHT_REUSE_EXISTING_SERVER=false npx playwright test src/__tests__/crossscreen.spec.ts --grep "EvidencePanel|evidence graph|graph fallback|seed" --reporter=line`: 5 mocked MAC-49 tests passed; one live-backend EvidencePanel test failed because Vite proxy could not connect to Core on `127.0.0.1:8090`.
- `PLAYWRIGHT_PORT=5186 PLAYWRIGHT_REUSE_EXISTING_SERVER=false npx playwright test src/__tests__/crossscreen.spec.ts --grep "EvidencePanel graph fallback|unknown graph source" --reporter=line`: pass, 5/5.
- `PLAYWRIGHT_PORT=5187 PLAYWRIGHT_REUSE_EXISTING_SERVER=false npx playwright test src/__tests__/crossscreen.spec.ts --grep "live EvidencePanel|EvidencePanel.*live|graph seed" --reporter=line`: skipped 6/6 with Core unavailable via Vite proxy (`ECONNREFUSED 127.0.0.1:8090`).
- Started Core API from `/home/mlasota/legal-ai-graph` with `uv run python -m legal_ai_graph.api.app`; `/health` returned `{"status":"ok"}` and `/api/status` returned real documents.
- `PLAYWRIGHT_PORT=5189 PLAYWRIGHT_REUSE_EXISTING_SERVER=false npx playwright test src/__tests__/crossscreen.spec.ts --grep "live EvidencePanel|EvidencePanel.*live|graph seed" --reporter=line`: pass, 6/6.
- `PLAYWRIGHT_PORT=5190 PLAYWRIGHT_REUSE_EXISTING_SERVER=false npx playwright test src/__tests__/crossscreen.spec.ts --reporter=line`: 35 passed, 1 failed. Failure was unrelated `AskPanel returns an answer with citations` timing out waiting for `/api/query` after entering `Thinking...`; Core `/health` and `/api/status` remained responsive.
- `rg -n "/api/upload|/api/docs/.*/trace|/trace" static`: no matches.
- `git diff --check`: pass.
- MAC-52 direct `/api/query` probe against `original_royalcomm` generic subject question: HTTP 200 in 35.513501s, `data_source="real"`, `answer_basis="retrieved_evidence"`, `validation_status="empty"`, empty answer/citations.
- MAC-52 direct `/api/query` probe against DRFA question: HTTP 200 in 59.102737s, `data_source="real"`, `answer_basis="retrieved_evidence"`, `validation_status="empty"`, empty answer/citations.
- `npx tsc --noEmit`: pass after MAC-52.
- `npm run build`: pass after MAC-52.
- `rg -n "source_uri" src static`: no matches after MAC-52.
- `npx playwright test src/__tests__/crossscreen.spec.ts --grep "query_backend_unavailable|degraded query|empty real query|unknown source" --reporter=line`: pass, 4/4.
- `PLAYWRIGHT_PORT=5191 PLAYWRIGHT_REUSE_EXISTING_SERVER=false npx playwright test src/__tests__/crossscreen.spec.ts --grep "AskPanel.*live|live AskPanel|query timeout" --reporter=line`: pass, 1/1 in 41.3s.
- `PLAYWRIGHT_PORT=5192 PLAYWRIGHT_REUSE_EXISTING_SERVER=false npx playwright test src/__tests__/crossscreen.spec.ts --reporter=line`: pass, 37/37 in 2.8m.

## Results

- No browser-facing UI source file under `src` or `static` references `source_uri`.
- AskPanel source badge no longer maps evidence-backed query responses to mock.
- Static lawyer chat displays the normalized assistant response source label.
- Focused Playwright coverage now asserts `/api/query` returns `data_source="real"` and tolerates current/absent `answer_basis`.
- Slow/stale activity, summary, or pipeline responses for document A cannot overwrite document B after selection changes.
- Summary stale-response regression is covered by Playwright.
- Atrium chronology/entity/people list header source badge now follows active row provenance instead of a people-only shortcut.
- Lattice KPI/agreement badges now follow field-level sources from `graph_counts`/`kpi_metrics`.
- DocumentPicker fallback rows show `claims unavailable` with a mock badge when `/api/status` lacks `graph_counts`, avoiding fabricated real zero counts.
- Atrium and Lattice augmentation provider rows show real counts only for keys present in `external_sources_by_source`; omitted providers show `unavailable` and a mock badge.
- Static lawyer trace debug shows `Trace debugging is unavailable in static mode.` and does not fetch legacy trace JSON.
- Static lawyer upload shows `Document upload unavailable` / `Upload is unavailable in this static lawyer build...` and no longer exposes a file picker or `/api/upload` call.
- EvidencePanel missing namespace shows `Evidence graph unavailable` / `No graph namespace is available for this document.`
- EvidencePanel missing seed shows `Evidence graph unavailable` / `No graph seed could be resolved for this item.`
- EvidencePanel graph 404/non-OK shows `Evidence graph unavailable` / `The evidence graph endpoint did not return usable graph data.`
- EvidencePanel empty graph shows `Evidence graph unavailable` / `The evidence graph endpoint returned no graph nodes for this item.`
- EvidencePanel real graph success path remains backed by `/api/graph`; unknown graph source states render as `unknown source state`, not mock.
- Live EvidencePanel tests no longer require the hardcoded default real document. They dynamically discover the document, namespace, register seed, and usable graph before exercising the UI.
- Live AskPanel query test no longer depends on the first `/api/status` document from the UI route. It discovers a Core document directly, verifies the UI sends `document_id`, and distinguishes request-dispatch failures from backend response latency/hangs.
- AskPanel typed `503 detail.code="query_backend_unavailable"` remains rendered as degraded/unavailable, never mock.
- AskPanel completed empty real query responses render `No answer` and `No answer could be produced from the retrieved evidence for this question.` instead of a misleading `Supported` badge.

## Remaining risks

- Full crossscreen verification depends on a long-lived backend API process on `localhost:8090`; the MAC-52 full run passed while Core stayed up.
- Historical review text still mentions `source_uri`; source grep is clean.
- Register/status fetches already had cancellation guards before this run; this batch did not broaden stale-response testing to every possible status/register path.
- If Core wants omitted augmentation providers shown as real zero, it should return explicit zero keys in `external_sources_by_source`.
- Live EvidencePanel and live AskPanel tests still require Core to be listening on `localhost:8090`; mocked fallback/degraded coverage is backend-independent and green.
- Core subprocess/model query latency is currently tens of seconds for live query probes; UI tests allow a targeted 180s response threshold and classify timeouts as backend latency/hang.

## Architect decisions needed

- Public query scope is currently `document_id` for normal lawyer Ask. Revisit only if Architect/Core move the public scope to `pack_id` or another matter-level identifier.
- No new Architect decision was needed for MAC-49. Source taxonomy work already introduced explicit unavailable/unknown states.

## Backend/Core follow-up needed

- Investigate local backend API daemon instability during long UI Playwright runs: repeated exit with `Failed to connect to GCS within 60 seconds. GCS may have been killed.`
- Existing open backend/core-adjacent follow-up remains: controlled query scope enforcement.

## Deferred review items

- Static synthesis remains mock-only but honestly badged; broader static artifact parity is still roadmap.
- No deferred MAC-52 UI item remains.

## Exact next recommended task

Keep PR #1 open for review/checkpoint use. Next UI work should come from the next Linear `ui` issue under `MAC-16` or from PR review feedback.
