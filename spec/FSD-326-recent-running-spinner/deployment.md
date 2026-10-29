# FSD-326 deployment handover

- Migration required: No
- Source repository: `https://github.com/puffer911/pi-web`
- Branch: `main`
- Source commit: `e4f81382c5d796c2dd50bd2f543a93e148b21e6f` (implementation commit; final merge commit recorded after self-merge)
- Target artifact/tag: FSD-319 Vanilla Runtime artifact for the source commit; default release selector is `latest` unless the Operator/SRE command specifies an exact artifact.
- Runtime target: Pi Web internal tooling service on the designated Mini PC only when explicitly authorized by the Operator/SRE deployment command.
- Change: the Recent tab identifies the agent and last-activity time without rendering the shared project path, reveals the per-row `⋯` session menu on pointer hover (and keeps it available to keyboard focus/touch) with the existing delete confirmation, and uses a visible CSS spinner for running sessions; idle remains a gray dot. Reduced-motion users receive a static ring.
- Data/migration impact: no schema or API change. Image-bearing live tool results are captured before batched reconciliation and merged with transcript results; persisted results use the existing lazy session URL, while reload persistence still requires the result to be present in the session transcript/server response.
- Invalidation: none beyond the normal static asset replacement in the new runtime artifact.
- Fresh-response validation: verify the deployed version, then smoke the Recent tab with synthetic running/idle fixtures at 390, 768, and 1440px; check no horizontal overflow, the agent/time-only secondary line, hover/focus/touch visibility of the Recent row menu and delete confirmation, live image retention after reconciliation, lazy image response, and verify `prefers-reduced-motion` keeps the ring visible without animation.
- Rollback: restore the previous known-good Vanilla Runtime artifact and perform fresh login/API/port smoke checks.
- Owner: SRE/Operator for artifact publication, deployment, restart, and rollback; Coder for source evidence and UI validation.
- Limitation: no runtime deployment is performed by this source change.
