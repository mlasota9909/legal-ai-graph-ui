# CLAUDE.md — legal-ai-graph-ui (UI workstream)

## Latest UI handoff

2026-06-30 UI Codex action status is in `CLAUDE-HANDOFF.md`. Latest completed Linear issue: `MAC-51` for dynamic live EvidencePanel test document/namespace/seed discovery. Next recommended UI task: `MAC-52`, classify and harden the live AskPanel query Playwright timeout; revisit query scope only if Architect/Core move normal Ask from `document_id` to another public scope.

## ⚠️ READ FIRST — worker methodology & cost (updated 2026-06-23 by the backend chat)
**Full guide: `/home/mlasota/legal-ai-coord/WORKER-METHODOLOGY.md` — read it before dispatching any worker.**
Your workers have been "failing silently" and you've been re-doing the work yourself in Opus, which hit the
session limit. The three rules that fix it:
1. **Never send agentic file-writes (Edit/Write/Bash) to a LOCAL bridge** (`claude-gb10a-run` / `claude-qwen36-run`).
   They emit `[TOOL_CALLS]…` as plain text and write **nothing** (`rc=0`) — that's your nginx.conf failure.
   File edits → **cursor-agent / codex2 / deepseek**. Local bridges = pure-text generation only (capture stdout,
   you save the file). qwen36 is currently broken (HTTP 400); codex1 is out of tokens until 2026-06-25.
2. **Verify by DIFF, not by the worker's word.** Workers print "Done" and exit `rc=0` having written nothing.
   Check `git status --porcelain` / `git diff` / the actual file. If nothing changed, **re-dispatch** (usually a
   missing flag — deepseek needs `--dangerously-skip-permissions`). **Do NOT self-implement in Opus** — that's
   the expensive anti-pattern that drained the allowance.
3. **Never iterate Playwright/UI testing inside the Opus loop.** Have a worker write the `*.spec.ts`, run
   `npx playwright test > .logs/pw.log 2>&1` in a background shell, and read the *result*. Reserve Playwright
   MCP for ONE bounded final acceptance pass — not debugging loops. (This is what hit your session limit.)

---

You are the **UI workstream** for an auditable legal evidence-graph product. This repo is the
**lawyer/operator-facing window** into the graph. You were started from the Claude-designed template at
`/home/mlasota/legal-ai/legal-ai-ui` (already ported here as your baseline) — React 18 + TS + Vite + Tailwind.

## End goal (the product)
A legal AI where **every artifact — registers, chronologies, document summaries, and these UI views — derives
from one auditable evidence graph, traceably**. Each displayed fact links back to graph nodes/source chunks
(provenance). Your job is to make that graph legible and trustworthy to a lawyer: real data, consistent
numbers, visible provenance, no invented content.

## Your mandate (from the operator)
Keep the template's *style* (the operator likes it); fix everything else:
1. **Real data only.** The template runs on `MockData` with a `dataSource: 'real'|'mock'|'simulated'` flag.
   Wire to the real backend `/api`, flip to `real`, quarantine/remove mock. No screen shows invented numbers.
2. **Consistency.** Object counts/links must reconcile across dashboard ↔ sub-screens (single source = the API).
3. **Auth + HTTPS** (currently neither; build on `nginx.conf`).
4. **Document packs** — implement properly (a pack = a matter with multiple related docs; coordinate the model
   with the backend via BRIDGE — it aligns with the backend's multi-doc/cross-doc work).
5. **Lawyer/operator screens** consistent with each other and the internal panels.
6. **Relationship graph viz** — render nodes + `SUPPORTED_BY`/`EVIDENCED_BY_EXTERNAL` edges + provenance from
   the `/api/graph` endpoint, in the template's visual style.
7. **QA via Playwright MCP** — assert cross-screen count reconciliation + "no `mock` data in a prod build" +
   key flows. This is your acceptance gate.

## Boundaries (do NOT cross)
- **You own ONLY this repo** (`/home/mlasota/legal-ai-graph-ui`).
- **Never edit** `/home/mlasota/legal-ai-graph` (backend — separate chat) or `/home/mlasota/legal-ai` (old prod).
- **Seam (read-only for you):** the data contract `legal-ai-graph/documentation/UI-DATA-CONTRACT.md` + the live
  `/api/*` it describes. Consume it; never query Neo4j/the graph directly.
- **Cross-chat comms:** `/home/mlasota/legal-ai-coord/BRIDGE.md` — read it each session; append your data
  needs / contract gaps / endpoint requests to the `UI → BACKEND` section. The backend chat answers there.

## Backend state you can rely on (as of 2026-06-23)
- Read-only API live: `cd /home/mlasota/legal-ai-graph && uv run python -m legal_ai_graph.api.app` (→ :8090).
  READY: `GET /api/status`, `/api/status/{id}`, `/api/graph?namespace&node&depth`, `/health`.
  STUB (keep mock for now): `/api/artifacts/content`, `/api/docs/{id}/export/html`. Full spec in the contract.
- Real namespaces in dev Neo4j: `romancath_v2`, `mdoc20260621_{hopper,tanyaday,original_royalcomm,volume_10}`.
- A per-claim `salience_score` exists on nodes → you can filter a summary/registers to top-N by importance.

## Linear
Project `legal-ai`, team MAC. Work under epic **MAC-16** with the **`ui`** label. The backend contract is
**MAC-15** (your blocker for real-data wiring — now done). Don't touch non-`ui` issues.

## Air-gap
Dev corpus is PUBLIC (cloud tools OK now). For production, the system must never expose source documents
without auth and must show provenance/`validation_status` on externally-sourced facts — design with that in mind.

## Delegation & research toolkit (you have the same workers as the backend chat)
You orchestrate + verify; route heavy implementation to worker agents and research to LDR — don't hand-build
everything yourself if a worker fits. Dispatch in the background and **verify by reading the worker's actual
output/log, not just its exit signal** (some emit false fail signals). Pattern:
`{ echo start; timeout <sec> <worker-cmd> "$PROMPT" < /dev/null; echo "rc=$?"; } > .logs/<task>.log 2>&1` (run in background).

- **cursor-agent / composer-2.5** — PRIMARY for frontend impl (it's a Cursor coding model, strong at React/TS):
  `cursor-agent --print --force --output-format text --model composer-2.5 "<prompt>"` (use `composer-2.5`, NOT
  `-fast`; do NOT use Opus via cursor-agent — cost; Fable is fully gated).
- **codex** — for complex/multi-step tasks: `codex2 exec --dangerously-bypass-approvals-and-sandbox -m gpt-5.5 "<p>" </dev/null`.
  Wrappers `codex1`/`codex2` (in ~/.local/bin) pin isolated CODEX_HOME. **Prefer `codex2`** — the backend chat
  uses `codex1`; running the *same* codex account concurrently from both chats can collide (rollout errors).
- **claude-deepseek-run** — cloud DeepSeek coding (no data egress concern for dev): needs
  `--dangerously-skip-permissions`; emits occasional false 'exit 144'/fail — verify by output.
- **claude-gb10a-run / claude-qwen36-run** — LOCAL bridges (zero cost). qwen36 currently returns EMPTY (endpoint
  output mapping under repair) — re-check before relying; good for simple local tasks once working.
- **LDR (Local Deep Research, zero-token)** — use it UNPROMPTED to research: legal-UI/UX best practices, how a
  lawyer should review an evidence graph, graph-viz library choices (3d-force-graph/cosmograph/etc.), accessibility,
  Playwright MCP patterns. Run: `docker exec local-deep-research python /data/ldr_runner.py /data/<q>.txt /data/<out>.md`
  (write the question to `/home/mlasota/local-deep-research/data/ldr/<q>.txt` first; 20 iterations default).
- **Playwright MCP** — your QA gate (cross-screen reconciliation, no-mock-in-prod, flows).

**Shared-fleet etiquette:** codex accounts + LDR + GB10/alienware are SHARED with the backend chat. Prefer
composer-2.5 + deepseek + LDR for your work; if you need codex, use `codex2`; flag any heavy/long concurrent use
in `BRIDGE.md` so we don't saturate the same resource. Deeper fleet notes + air-gap/no-gaming conventions live in
the backend chat's memory at `/home/mlasota/.claude/projects/-home-mlasota/memory/` (readable for reference).

## Conventions
Match the existing code style. Commit on this repo's own branch; don't push unless asked. Build your own memory +
Linear (MAC-16) for continuity. Verify the backend `/api` is what you build against (run it; read the contract) —
don't assume the mock shapes are final. No-gaming: make data genuinely real/consistent; don't paper over gaps —
badge unimplemented panels honestly as mock/simulated.
