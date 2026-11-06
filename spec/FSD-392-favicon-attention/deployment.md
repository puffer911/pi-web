# FSD-392 deployment handover

- Migration required: No
- Source repository: `https://github.com/puffer911/pi-web`
- Branch: `main`
- Source commit: pending code commit; update before merge
- Target artifact/tag: FSD-319 Vanilla Runtime artifact for the exact source commit; default release selector is `latest` unless the Operator/SRE command specifies an exact artifact.
- Runtime target: Pi Web internal tooling service only when explicitly authorized by the Operator/SRE deployment command.
- Change: keep a bounded, slower running-status poll while the browser tab is hidden so completion can update the favicon without a tab click; when the active chat becomes visible/focused or is interacted with, clear its completion/unread attention without changing session selection.
- Data/migration impact: no schema, API, auth, migration, or database change.
- Invalidation: normal static asset/runtime artifact replacement only; no manual cache purge.
- Fresh-response validation: verify the deployed version and configured base path, then use synthetic running/completed/unread fixtures at 390, 768, and 1440px. Confirm hidden-tab completion changes the favicon after the bounded poll, visible/focused active-chat interaction clears only that session's attention, other completed sessions remain amber, and no horizontal overflow or console errors appear.
- Rollback: restore the previous known-good Vanilla Runtime artifact and perform fresh login/API/port smoke checks.
- Owner: SRE/Operator for artifact publication, deployment, restart, and rollback; Coder for source evidence and UI validation.
- Limitation: browser engines may suspend hidden-page JavaScript or throttle timers; in that case the favicon update waits for the browser to resume the page, while existing system notification fallback remains available. No runtime deployment is performed by this source change.
