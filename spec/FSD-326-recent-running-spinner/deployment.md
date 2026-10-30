# FSD-326 deployment handover

- Migration required: No
- Source repository: `https://github.com/puffer911/pi-web`
- Branch: `main`
- Source commit: `dbad7d784ea66a4f890eeba40f00d5f127784fb5` (clickable read-image file-panel follow-up; final merge commit recorded after self-merge)
- Target artifact/tag: FSD-319 Vanilla Runtime artifact for the source commit; default release selector is `latest` unless the Operator/SRE command specifies an exact artifact.
- Runtime target: Pi Web internal tooling service on the designated Mini PC only when explicitly authorized by the Operator/SRE deployment command.
- Change: the Recent tab identifies the agent and last-activity time without rendering the shared project path, removes the unused agent/time separator, gives the title full row width until the per-row `⋯` menu is hovered (while keeping keyboard/focus/touch access), centers the status indicator, keeps the existing delete confirmation and visible CSS spinner, and adds `Delete this and older` for unarchived Recent rows with bounded bulk deletion and running-session protection. A page-local amber completion dot marks a session that just finished, including the selected session, until the user changes selection or reloads. The browser-tab favicon adds a rotating amber ring while any session is running and restores the normal icon when all sessions settle; reduced-motion users receive a static ring. Image results from the `read` tool open their source file in the right file panel when clicked, while other image results keep the modal preview. The Sessions tab restores its original desktop 28px row rhythm and hover-only overflow action.
- Data/migration impact: no schema or API change. Image-bearing live tool results are captured before batched reconciliation and merged with transcript results; persisted results use the existing lazy session URL, while reload persistence still requires the result to be present in the session transcript/server response.
- Invalidation: none beyond the normal static asset replacement in the new runtime artifact.
- Fresh-response validation: verify the deployed version, then smoke the Recent tab with synthetic running/idle fixtures at 390, 768, and 1440px; check no horizontal overflow, the agent/time-only secondary line, hover/focus/touch visibility of the Recent row menu and delete confirmation, live image retention after reconciliation, lazy image response, click a `read` image and verify the right file panel opens the source path, the favicon ring while a session runs, restoration of the normal favicon after settle, and verify `prefers-reduced-motion` keeps both rings visible without animation.
- Rollback: restore the previous known-good Vanilla Runtime artifact and perform fresh login/API/port smoke checks.
- Owner: SRE/Operator for artifact publication, deployment, restart, and rollback; Coder for source evidence and UI validation.
- Limitation: no runtime deployment is performed by this source change.
