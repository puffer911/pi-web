# FSD-387 deployment handover

- Migration required: No
- Source repository: `https://github.com/puffer911/pi-web`
- Branch: `main`
- Source commit: `TBD` (follow-up to FSD-326; set exact self-merge commit before handover)
- Target artifact/tag: FSD-319 Vanilla Runtime artifact for the exact source commit; default release selector is `latest` unless the Operator/SRE command specifies an exact artifact.
- Runtime target: Pi Web internal tooling service only when explicitly authorized by the Operator/SRE deployment command.
- Change: reading a completed session immediately clears its Recent amber completion dot and its browser-favicon completion/unread attention, including re-clicking the selected row and the `Mark as read` action. The normal Pi favicon is restored when no running or unread/completion attention remains. Suppressed subagent completions are excluded from completion favicon attention.
- Data/migration impact: no schema, API, auth, migration, or database change.
- Invalidation: normal static asset/runtime artifact replacement only; no manual cache purge.
- Fresh-response validation: verify the deployed version and configured base path, then use synthetic running/completed/unread/root and suppressed-subagent fixtures at 390, 768, and 1440px. Confirm the Recent dot changes amber to idle immediately after selecting/re-clicking or `Mark as read`; confirm the favicon transitions green, split green/amber, amber, and back to the original Pi icon without a tab switch or reload; verify no horizontal overflow and no suppressed-subagent favicon attention.
- Rollback: restore the previous known-good Vanilla Runtime artifact and perform fresh login/API/port smoke checks.
- Owner: SRE/Operator for artifact publication, deployment, restart, and rollback; Coder for source evidence and UI validation.
- Limitation: no runtime deployment is performed by this source change.
