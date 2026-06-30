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

Pre-existing dirty files before the MAC-49 continuation: untracked `.vite/` only. It remains untracked and was not committed.

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
- `rg -n "/api/upload|/api/docs/.*/trace|/trace" static`: no matches.
- `git diff --check`: pass.

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

## Remaining risks

- Full crossscreen verification depends on a long-lived backend API process on `localhost:8090`; the backend daemon exited twice during long runs with Ray GCS failure.
- Historical review text still mentions `source_uri`; source grep is clean.
- Register/status fetches already had cancellation guards before this run; this batch did not broaden stale-response testing to every possible status/register path.
- If Core wants omitted augmentation providers shown as real zero, it should return explicit zero keys in `external_sources_by_source`.
- Live EvidencePanel tests still require Core to be listening on `localhost:8090`; MAC-49 mocked fallback coverage is backend-independent and green.
- Existing live EvidencePanel tests still assume the default real document path. `MAC-51` tracks making that discovery dynamic.

## Architect decisions needed

- Public query scope is currently `document_id` for normal lawyer Ask. Revisit only if Architect/Core move the public scope to `pack_id` or another matter-level identifier.
- No new Architect decision was needed for MAC-49. Source taxonomy work already introduced explicit unavailable/unknown states.

## Backend/Core follow-up needed

- Investigate local backend API daemon instability during long UI Playwright runs: repeated exit with `Failed to connect to GCS within 60 seconds. GCS may have been killed.`
- Existing open backend/core-adjacent follow-up remains: controlled query scope enforcement.

## Deferred review items

- Static synthesis remains mock-only but honestly badged; broader static artifact parity is still roadmap.
- Live EvidencePanel test discovery hardening is deferred to `MAC-51`.

## Exact next recommended task

Move to `MAC-51`: make live EvidencePanel Playwright setup discover a valid document, namespace, and seed dynamically from the live API instead of relying on the default hardcoded real document path.
