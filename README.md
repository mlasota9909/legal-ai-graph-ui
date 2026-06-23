# legal-ai-ui

React/Vite UI for the Legal-AI operator and lawyer-facing workbench.

## Auditability contract

The UI is a projection consumer, not a source of truth. Claims, entities, chronology rows, memo assertions, synthesis sections, and OpenSearch-backed lists should carry stable IDs that can click through to ledger-backed history.

Target audit views:

- claim history: proposal, challenge, skeptic review, arbitration, feedback, repair, supersession
- evidence trace: page, chunk, OCR confidence, source artifact
- confidence history over time
- stale/superseded reasons
- regenerated artifacts caused by a claim, entity, feedback item, or quality issue
- backend/model trace: model, machine, run id, prompt/rubric version

The target architecture is **MAF-orchestrated iterative swarm reasoning over a durable claim and decision ledger, with projection-based artifacts, lawyer-visible auditability, and living mind-map projections of document/matter understanding**. UI components should preserve the distinction between current projections and durable reasoning state.

## Mind-map graph view contract

The graph view should render living mind-map projections produced by the backend. It must not invent graph state client-side except for transient layout state.

If a future graph projection uses Memgraph, the UI should still consume controlled backend APIs rather than treating Memgraph Lab as the product surface. Memgraph Lab is acceptable for operator/developer exploration, but lawyer-visible auditability must remain in Legal-AI UI components that resolve every node and edge back to durable claim/entity history, evidence refs, quality issues, feedback, repair jobs, and artifact dependencies.

A lawyer should be able to:

- inspect document and matter maps
- click a node to see evidence, claim history, quality issues, and repair jobs
- mark an edge wrong
- request entity merge/split
- flag OCR corruption or malformed labels
- request reconsideration
- see which artifacts depend on a node or edge
- see whether a projection is stale or recently rebuilt

All such actions should create durable feedback, quality issue, or reconsideration events rather than mutating UI-only state.

The UI should not issue canonical graph mutations directly to Memgraph. Graph review actions should be posted to coordination APIs that create durable events; Memgraph, OpenSearch, and JSON graph projections are then rebuilt or marked stale by backend projection workers.
