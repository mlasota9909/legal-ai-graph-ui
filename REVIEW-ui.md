# REVIEW-ui

## Action status

### 2026-06-29 — UI Codex action run

- **U1 actioned:** removed public `source_uri` from `src/types/contracts.ts` `RegisterProvenance` and `src/components/atrium/AtriumDashboard.tsx` claim-detail provenance typing. Rendering remains chunk/page based.
- **U2 actioned:** updated `src/components/query/AskPanel.tsx` and `static/lawyer-app.jsx` so GraphRAG query answers use the accepted `real | simulated | mock` badge taxonomy and compatibility-map `retrieved_evidence` / `answer_basis="retrieved_evidence"` to `real`.
- **Tests run:** `npx tsc --noEmit` passed; `rg -n "source_uri" src static` returned no matches; `npx playwright test src/__tests__/crossscreen.spec.ts --reporter=line` passed 20/20 after starting the backend API locally.
- **Files changed:** `src/types/contracts.ts`, `src/components/atrium/AtriumDashboard.tsx`, `src/components/query/AskPanel.tsx`, `static/lawyer-app.jsx`, `src/__tests__/crossscreen.spec.ts`, `CLAUDE-HANDOFF.md`, `REVIEW-ui.md`, `/home/mlasota/legal-ai-coord/BRIDGE.md`.
- **Deferred:** U3 field-level source badges, U4 stale response guards, U5/U6 broader static/query-scope parity, U7 EvidencePanel seed/fallback safety.
- **Blocked on Architect/Core:** public query scope policy remains open; no UI query-scope change made in this batch.

### 2026-06-29 — UI Codex continuation

- **U4 actioned:** added cancellation/abort guards and returned-`document_id` checks for doc-scoped activity, summary, and pipeline effects in `src/hooks/useWorkspace.ts`.
- **Stale state cleared:** activity, summary, and pipeline state are cleared when `docId` changes so previous document data is not shown while the next fetch is pending.
- **Tests run:** `npx tsc --noEmit` passed; opencode local Playwright run for `stale summary response cannot overwrite selected document` passed; full `npx playwright test src/__tests__/crossscreen.spec.ts --reporter=line` passed 21/21; `git diff --check` passed.
- **Files changed:** `src/hooks/useWorkspace.ts`, `src/__tests__/crossscreen.spec.ts`, `CLAUDE-HANDOFF.md`, `REVIEW-ui.md`.
- **Linear:** `MAC-36` created under `MAC-16`, labelled `ui`, status `Done`.
- **Deferred:** U3 field-level source badges is now the next recommended UI task. Query scope remains blocked on Architect/Core.

### 2026-06-29 — UI Codex U3 micro-fix

- **U3 partially actioned:** fixed Atrium list artifact header source derivation so chronology, entities, and people tabs badge as real when their active backend register rows are real.
- **Why narrow:** avoided global `isRealData` badge changes for reports/signals/KPIs because that can mark seed or fallback values as real.
- **Tests run:** `npx tsc --noEmit` passed; opencode local Playwright run for `atrium list artifact source badge follows real active rows` passed; full `npx playwright test src/__tests__/crossscreen.spec.ts --reporter=line` passed 22/22; `git diff --check` passed.
- **Files changed:** `src/components/atrium/AtriumDashboard.tsx`, `src/__tests__/crossscreen.spec.ts`, `CLAUDE-HANDOFF.md`, `REVIEW-ui.md`.
- **Linear:** `MAC-37` created under `MAC-16`, labelled `ui`, status `Done`.
- **Deferred:** remaining U3 field-level KPI/agreement/augmentation source tracking.

### 2026-06-29 — UI Codex U3 field-source continuation

- **U3 partially actioned:** added field-level source metadata for Lattice KPI/agreement display (`claimsTotalSource`, `openConflictsSource`, `humanQueueSource`, `claimsDisputedSource`, `claimsSource`, `jaccardSource`).
- **U3 partially actioned:** changed Lattice KPI and agreement `SourceDot` badges to use backend field sources from `graph_counts`/`kpi_metrics` rather than hardcoded `real`/`simulated` or global `data.isRealData`.
- **U3 partially actioned:** changed `DocumentPicker` fallback rows so `/api/status` fallback counts use `graph_counts` when present, and otherwise display claim counts as unavailable/mock rather than fabricated real zeros.
- **Tests run:** `npx tsc --noEmit` passed; `npm run build` passed; opencode local Playwright run for `document picker fallback does not badge fabricated zero counts as real` passed; changed-area Playwright run passed 4/4; `npx playwright test src/__tests__/crossscreen.spec.ts --grep-invert 'AskPanel returns an answer with citations' --reporter=line` passed 23/23; focused AskPanel test passed after backend restart; final full 24-test run was interrupted after backend API exited with Ray GCS failure.
- **Files changed:** `src/types/contracts.ts`, `src/hooks/useWorkspace.ts`, `src/components/lattice/LatticeDashboard.tsx`, `src/__tests__/crossscreen.spec.ts`, `CLAUDE-HANDOFF.md`, `REVIEW-ui.md`, `CLAUDE.md`, `/home/mlasota/legal-ai-coord/BRIDGE.md`.
- **Linear:** `MAC-38` created under `MAC-16`, labelled `ui`, status `Done`.
- **Blocked on Core/backend:** long full-suite runs are unreliable while the local backend API daemon exits with Ray GCS failure.
- **Deferred:** U3 augmentation provider row source handling remains; U5/U6 static/query-scope parity and U7 EvidencePanel seed/fallback safety remain open.

### 2026-06-29 — UI Codex U3 augmentation completion

- **U3 actioned:** Atrium and Lattice augmentation provider rows now read only from `graph_counts.external_sources_by_source` for provider counts.
- **No invented omitted counts:** omitted provider keys now render as `unavailable` with a mock badge instead of falling back to seed values like eyecite 312 or simulated provider totals.
- **Explicit zero remains real:** a present key with value `0` is still rendered as a real backend count.
- **Tests run:** `npx tsc --noEmit` passed; changed-area Playwright run for augmentation provider rows plus Lattice source badges passed 2/2; opencode local Playwright run for the augmentation regression passed; `npm run build` passed; `git diff --check` passed.
- **Files changed:** `src/components/atrium/AtriumDashboard.tsx`, `src/components/lattice/LatticeDashboard.tsx`, `src/__tests__/crossscreen.spec.ts`, `CLAUDE-HANDOFF.md`, `REVIEW-ui.md`, `CLAUDE.md`, `/home/mlasota/legal-ai-coord/BRIDGE.md`.
- **Linear:** `MAC-39` created under `MAC-16`, labelled `ui`, status `Done`.
- **Deferred:** U5/U6 static/query-scope parity and U7 EvidencePanel seed/fallback safety remain open.

## 1. Executive summary

- Overall UI alignment with VISION.md: The SPA mostly behaves as a projection surface over backend APIs, with real register rows, summary panels, evidence graph navigation, source badges, and post-run review concepts. The main gaps are source-badge honesty and contract drift.
- Top 3 UI risks: UI types admit `source_uri`; GraphRAG answers with `data_source="retrieved_evidence"` are displayed as mock; several KPI/agreement/augmentation values merge real API values with seed data but badge the result incorrectly.
- API consumption health: `useWorkspace` is the main state hub, but `DocumentPicker`, `AskPanel`, `EvidencePanel`, and static apps also fetch directly. `AskPanel` and `EvidencePanel` are known exceptions; `DocumentPicker` should be audited because it fabricates fallback pack counts.
- Source badge/data honesty health: Needs work. Some real data is badged mock, some seed values are badged real, and some unavailable provider counts fall back to simulated values after real status loads.
- Static app parity health: Static lawyer app has real endpoint wiring for many artifacts, but still contains old `/trace`, `/api/upload`, raw namespace chat, and a mock-only synthesis panel.
- Recommended next UI task: Remove `source_uri` from public UI types after the Core contract decision, then fix source badge derivation and stale response guards.

## 2. Critical UI findings

### U1. UI public types admit `source_uri` even though the UI brief forbids it reaching the UI layer

- Severity: Critical
- Files/functions/components: `src/types/contracts.ts`, `src/components/atrium/AtriumDashboard.tsx`
- Evidence: The UI review brief says `source_uri` must never reach the UI layer at `/home/mlasota/legal-ai-graph-ui/CODE-REVIEW-BRIEF.md:242`. `RegisterProvenance` includes `source_uri` at `/home/mlasota/legal-ai-graph-ui/src/types/contracts.ts:156`. `ClaimDetail.provenance_chain` includes `source_uri` at `/home/mlasota/legal-ai-graph-ui/src/components/atrium/AtriumDashboard.tsx:39`.
- Why it matters: Even if not rendered today, accepting local filesystem paths into browser-side contracts violates the UI safety rule and expands the chance of accidental rendering/logging.
- Recommended fix: After Core removes/redacts the field from public responses, remove `source_uri` from TypeScript contracts and component-local response types. Use chunk/page/document identifiers only.
- Verification: `cd /home/mlasota/legal-ai-graph-ui && npx tsc --noEmit && rg -n "source_uri" src`
- Suggested UI task: Remove UI `source_uri` types once the backend contract is corrected.

### U2. Evidence-backed Ask answers are badged as mock

- Severity: High
- Files/functions/components: `src/components/query/AskPanel.tsx`, `src/types/contracts.ts`
- Evidence: `AskPanel.parseDataSource` only accepts `real` and `simulated`, mapping all other values to `mock` at `/home/mlasota/legal-ai-graph-ui/src/components/query/AskPanel.tsx:16`. The backend/contract currently returns `data_source="retrieved_evidence"` for `/api/query`. `AskPanel` displays the parsed badge at `/home/mlasota/legal-ai-graph-ui/src/components/query/AskPanel.tsx:146`.
- Why it matters: A grounded GraphRAG response can be displayed as mock data, which is the opposite of source honesty. This can cause lawyers to discount real evidence-backed answers or misunderstand system state.
- Recommended fix: Coordinate with Core to normalize `/api/query` to `data_source="real"`. Until then, handle `retrieved_evidence` explicitly only as a temporary compatibility path and make the contract drift visible in tests.
- Verification: `cd /home/mlasota/legal-ai-graph-ui && npx tsc --noEmit && npx playwright test --reporter=line`
- Suggested UI task: Update AskPanel source parsing after Core fixes the query contract.

### U3. KPI, agreement, pack, and augmentation badges can mislabel mixed real/seed data

- Severity: High
- Files/functions/components: `src/hooks/useWorkspace.ts`, `src/components/lattice/LatticeDashboard.tsx`, `src/components/atrium/AtriumDashboard.tsx`
- Evidence: `useWorkspace` initializes KPI/agreement/augmentation from mock seed data at `/home/mlasota/legal-ai-graph-ui/src/hooks/useWorkspace.ts:377`. `applyStatus` updates only fields present in status and leaves other seed values intact at `/home/mlasota/legal-ai-graph-ui/src/hooks/useWorkspace.ts:230` and `/home/mlasota/legal-ai-graph-ui/src/hooks/useWorkspace.ts:237`. Lattice hardcodes Claims as simulated and Conflicts/Human queue as real at `/home/mlasota/legal-ai-graph-ui/src/components/lattice/LatticeDashboard.tsx:533`. Agreement columns use global `data.isRealData` rather than field-level source at `/home/mlasota/legal-ai-graph-ui/src/components/lattice/LatticeDashboard.tsx:603`. `DocumentPicker` falls back from `/api/packs` to `/api/status` and creates real pack counts with `claims_total: 0` at `/home/mlasota/legal-ai-graph-ui/src/components/lattice/LatticeDashboard.tsx:37` and `/home/mlasota/legal-ai-graph-ui/src/components/lattice/LatticeDashboard.tsx:46`. Atrium list-artifact header only marks people rows real, not chronology/entities, at `/home/mlasota/legal-ai-graph-ui/src/components/atrium/AtriumDashboard.tsx:810`. External augmentation provider rows fall back to simulated seed counts when a real status response omits a provider key at `/home/mlasota/legal-ai-graph-ui/src/components/atrium/AtriumDashboard.tsx:928`.
- Why it matters: The UI can show real badges for seed values or mock/simulated badges for real backend values. This directly affects lawyer trust and violates the no-invented-data invariant.
- Recommended fix: Track data source per KPI/agreement/augmentation field. Do not mark fallback zero counts as real unless the API explicitly returned that count. Treat absent provider keys in a real count map as real zero only if the contract says the map is complete; otherwise show unavailable.
- Verification: Add Playwright assertions that source badges match loaded real fields and that fallback pack counts are not displayed as real fabricated zeros.
- Suggested UI task: Refactor field-level badge derivation for Lattice/Atrium status-derived values.

### U4. Some doc-scoped async responses can overwrite state after document switch

- Severity: High
- Files/functions/components: `src/hooks/useWorkspace.ts`
- Evidence: Status polling and register loading use cancellation guards at `/home/mlasota/legal-ai-graph-ui/src/hooks/useWorkspace.ts:452` and `/home/mlasota/legal-ai-graph-ui/src/hooks/useWorkspace.ts:478`. Activity, summary, and pipeline fetch effects do not cancel or verify returned `document_id` before setting state at `/home/mlasota/legal-ai-graph-ui/src/hooks/useWorkspace.ts:535`, `/home/mlasota/legal-ai-graph-ui/src/hooks/useWorkspace.ts:549`, and `/home/mlasota/legal-ai-graph-ui/src/hooks/useWorkspace.ts:569`. `selectRun` changes `docId` at `/home/mlasota/legal-ai-graph-ui/src/hooks/useWorkspace.ts:404`.
- Why it matters: A slow response for document A can populate activity, summary, or pipeline while the user is viewing document B. That is a serious matter-confusion risk in a legal evidence UI.
- Recommended fix: Add `AbortController` or cancellation flags to each doc-scoped effect and verify response `document_id` matches the current `docId` before setting state. Clear doc-scoped summary/pipeline/activity immediately on document switch unless deliberately retained with a loading badge.
- Verification: Add a Playwright or hook-level test that switches documents while delaying the first response and confirms stale data is not rendered.
- Suggested UI task: Add doc-scoped race guards in `useWorkspace`.

### U5. Static lawyer app still uses older or incomplete workflow seams

- Severity: Medium
- Files/functions/components: `static/lawyer.html`, `static/lawyer-app.jsx`, `static/lawyer-artifacts.jsx`
- Evidence: Static trace debug fetches `/api/docs/{docId}/trace` at `/home/mlasota/legal-ai-graph-ui/static/lawyer.html:55`. Static upload posts to `/api/upload` at `/home/mlasota/legal-ai-graph-ui/static/lawyer.html:135`. Static chat sends raw namespace to `/api/query` at `/home/mlasota/legal-ai-graph-ui/static/lawyer-app.jsx:1148`. Static synthesis is explicitly mock-only at `/home/mlasota/legal-ai-graph-ui/static/lawyer-artifacts.jsx:1386` and badged mock at `/home/mlasota/legal-ai-graph-ui/static/lawyer-artifacts.jsx:1444`.
- Why it matters: The synthesis mock is honestly badged, so it is not silent invented data. The issue is parity and operator confidence: static surfaces still expose older endpoint assumptions and incomplete workflow panels.
- Recommended fix: Either wire static panels to the current contract endpoints or mark unavailable features as unavailable with clear badges and no fake operational affordance. Align static chat request shape with the Core query-scope decision.
- Verification: Extend static app tests to cover upload/trace unavailable states and query badge behavior.
- Suggested UI task: Audit static app endpoint parity against `UI-DATA-CONTRACT.md`.

### U6. Normal lawyer chat sends raw namespace instead of matter/package scope

- Severity: Medium
- Files/functions/components: `src/components/query/AskPanel.tsx`, `static/lawyer-app.jsx`
- Evidence: SPA `AskPanel` posts `{ question, namespace }` at `/home/mlasota/legal-ai-graph-ui/src/components/query/AskPanel.tsx:118`. Static lawyer chat posts `{ question, namespace: currentNamespace || null }` at `/home/mlasota/legal-ai-graph-ui/static/lawyer-app.jsx:1148`.
- Why it matters: Namespace is a backend implementation detail. The lawyer workflow is document/matter/package based, and public chat should not depend on arbitrary raw graph namespace strings.
- Recommended fix: After Core publishes the accepted query scope, send `pack_id` or `document_id` from the normal lawyer Ask flows. Keep raw namespace only for any explicitly labelled operator/debug path.
- Verification: Playwright should assert the query request body uses the approved public scope and still returns citations.
- Suggested UI task: Update AskPanel/static chat request shape after Core scope validation lands.

## 3. API seam and type safety

- `src/types/contracts.ts` mirrors the backend too permissively for `source_uri`; this should be removed from browser-facing types.
- `QueryResponse.data_source` is typed as string. Once Core normalizes it, the UI should narrow this to the shared `DataSource` taxonomy or parse unknown values as unavailable rather than silently mock.
- `useWorkspace` remains the central API state hub for most data. `AskPanel` and `EvidencePanel` are documented exceptions, but `DocumentPicker` also fetches `/api/packs` and `/api/status` directly and fabricates fallback counts.
- Null guards are generally present, but stale response guards are missing for activity, summary, and pipeline effects.
- Component fetches should not invent legal/graph semantics. The `DocumentPicker` fallback should not manufacture real counts from `/api/status` if `/api/packs` is unavailable.

## 4. No invented data / source badge honesty

- Real register rows are converted into chronology, people, and entity rows with `dataSource: "real"`, which is good.
- Seeded KPI/agreement values remain in state after partial real status updates, but the display sometimes badges them as real.
- AskPanel currently maps an evidence-backed non-standard source to mock.
- Static synthesis is mock-only but honestly badged; keep that honesty until it is wired.
- Missing data should be shown as unavailable or explicitly simulated/mock, not as real zero.
- Tests should assert source-badge behavior for GraphRAG, KPI cells, agreement columns, external augmentation rows, and pack picker counts.

## 5. Lawyer workflow fit

- Document/package selection exists, but `DocumentPicker` needs source-safe counts and should consume the canonical matter/package contract.
- Registers for chronology, people, entities, organisations, legislation, authorities, and documents are partially represented through backend register endpoints.
- Summaries/memos are wired through backend summary endpoints in SPA and static memo panels.
- GraphRAG chat is present and citation-aware, but source badge and query-scope issues need correction.
- Evidence drill-down exists through claim detail and graph visualization, with chunk/page-oriented navigation.
- Review queues, conflicts, and adjudication concepts are present as post-run workflow objects, which matches the vision.
- Authority verification, privilege/sensitivity flags, export safety, and targeted reprocessing need continued parity work, but I would treat most remaining gaps as roadmap unless the UI presents them as complete real functionality.

## 6. Non-blocking review model

- I did not find UI text that clearly makes lawyer approval a mandatory prerequisite for first-pass analysis completion in the reviewed paths.
- "Human queue", "review", "adjudication", and "conflicts" are presented as downstream workflow objects. Keep them post-run.
- Avoid future wording such as "analysis waits for lawyer approval" or "must adjudicate before synthesis" unless it is explicitly a separate optional rerun workflow.
- Static upload/configuration should start analysis autonomously after configuration; lawyer feedback should remain curation/reprocessing input.

## 7. Evidence drill-down and graph visualisation

- `EvidencePanel` fetches registers to find a root chunk and then fetches `/api/graph` for graph visualization. It uses cancellation guards, which is good.
- Citation clicks in `AskPanel` navigate toward evidence by node id where present.
- The UI should not infer graph/legal relationships client-side. Keep relationship semantics in Core and render only backend-provided nodes/edges.
- Remove `source_uri` from claim detail types before adding any richer evidence inspector, so local paths cannot leak through future render/log paths.
- Ensure graph edge provenance keeps chunk/page/source URL distinctions without local source path leakage.

## 8. Static lawyer/operator app parity

- Static lawyer app consumes several current APIs, including matters/status/registers/feedback/summary in artifact panels.
- Static app still has old `/trace`, `/api/upload`, and mock-only synthesis paths. These should be marked as unavailable or wired to current endpoints.
- Static chat should follow the same query-scope and `data_source` badge rules as the SPA.
- Static tests currently check that static lawyer app receives real data from matters/status; broaden them to artifact-specific badges and unavailable states.
- Operator/static graph views should not create graph relationships client-side beyond display transformations of backend-provided data.

## 9. Auth/security

- Auth token reads are generally inside fetch helper paths. I did not find token logging in the reviewed snippets.
- `localStorage` token use is acceptable for the current dev/staging model, but production hardening should consider expiration and storage risk.
- Source path leakage is the main UI security concern because public contracts include `source_uri`.
- Static trace debug renders raw JSON from a debug endpoint if available. Keep debug output disabled or clearly operator-only before production.
- Export buttons should only export backend-generated summaries and should preserve provenance without local path exposure.

## 10. UI verification commands

```bash
cd /home/mlasota/legal-ai-graph-ui
npx tsc --noEmit
npx playwright test --reporter=line
rg -n "source_uri|retrieved_evidence|/api/query|/api/upload|/trace" src static
```

Do not weaken tests to pass.

## 11. Suggested UI task packets

```text
Repo: /home/mlasota/legal-ai-graph-ui
Owner chat: UI
Recommended agent: UI implementation agent
Objective: Remove source_uri from public UI types and claim-detail handling after Core contract update.
Files likely involved: src/types/contracts.ts, src/components/atrium/AtriumDashboard.tsx
Do not touch: /home/mlasota/legal-ai-graph
Acceptance: No browser-facing TypeScript contract includes source_uri; chunk/page evidence still displays.
Verification commands: cd /home/mlasota/legal-ai-graph-ui && npx tsc --noEmit && rg -n "source_uri" src
Return: Remaining provenance fields used by the UI.
```

```text
Repo: /home/mlasota/legal-ai-graph-ui
Owner chat: UI
Recommended agent: UI implementation agent
Objective: Correct AskPanel source badge behavior for GraphRAG responses.
Files likely involved: src/components/query/AskPanel.tsx, src/types/contracts.ts, src/__tests__/crossscreen.spec.ts
Do not touch: /home/mlasota/legal-ai-graph
Acceptance: Evidence-backed query responses are not shown as mock; unknown source values are surfaced as contract errors or unavailable states.
Verification commands: cd /home/mlasota/legal-ai-graph-ui && npx tsc --noEmit && npx playwright test --reporter=line
Return: Query badge mapping and test coverage.
```

```text
Repo: /home/mlasota/legal-ai-graph-ui
Owner chat: UI
Recommended agent: UI implementation agent
Objective: Make KPI, agreement, augmentation, and pack-picker badges field-accurate.
Files likely involved: src/hooks/useWorkspace.ts, src/components/lattice/LatticeDashboard.tsx, src/components/atrium/AtriumDashboard.tsx, src/__tests__/crossscreen.spec.ts
Do not touch: /home/mlasota/legal-ai-graph
Acceptance: Seed values are not badged real; real backend values are not badged mock/simulated; fallback pack counts are not fabricated as real zeros.
Verification commands: cd /home/mlasota/legal-ai-graph-ui && npx tsc --noEmit && npx playwright test --reporter=line
Return: Field-level source rules.
```

```text
Repo: /home/mlasota/legal-ai-graph-ui
Owner chat: UI
Recommended agent: UI implementation agent
Objective: Add stale-response guards for doc-scoped activity, summary, and pipeline effects.
Files likely involved: src/hooks/useWorkspace.ts, src/__tests__/crossscreen.spec.ts
Do not touch: /home/mlasota/legal-ai-graph
Acceptance: A delayed response for document A cannot update the UI after selecting document B.
Verification commands: cd /home/mlasota/legal-ai-graph-ui && npx tsc --noEmit && npx playwright test --reporter=line
Return: Race condition test and implementation summary.
```

```text
Repo: /home/mlasota/legal-ai-graph-ui
Owner chat: UI
Recommended agent: UI implementation agent
Objective: Align static lawyer app endpoints and badges with the current API contract.
Files likely involved: static/lawyer.html, static/lawyer-app.jsx, static/lawyer-artifacts.jsx, src/__tests__/crossscreen.spec.ts
Do not touch: /home/mlasota/legal-ai-graph
Acceptance: Static app either uses current endpoints or clearly marks unavailable features; chat and artifacts follow the same source-badge rules as the SPA.
Verification commands: cd /home/mlasota/legal-ai-graph-ui && npx playwright test --reporter=line
Return: Static endpoint inventory and behavior changes.
```

```text
Repo: /home/mlasota/legal-ai-graph-ui
Owner chat: UI
Recommended agent: UI implementation agent
Objective: Update normal lawyer Ask flows to use the approved public query scope.
Files likely involved: src/components/query/AskPanel.tsx, src/hooks/useWorkspace.ts, static/lawyer-app.jsx
Do not touch: /home/mlasota/legal-ai-graph
Acceptance: SPA and static lawyer chat send pack_id or document_id after Core supports it; raw namespace is not used in normal lawyer mode.
Verification commands: cd /home/mlasota/legal-ai-graph-ui && npx tsc --noEmit && npx playwright test --reporter=line
Return: Request body shape for each Ask surface.
```
