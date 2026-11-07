# FSD-397 deployment handover

- Migration required: No
- Source repository: `https://github.com/puffer911/pi-web`
- Branch: `main`
- Source commit: `2526d438f5e3faf297ee920cb91297db88e3a4ce`
- Target artifact/tag: FSD-319 Vanilla Runtime artifact for the exact source commit; default release selector is `latest` unless the Operator/SRE command specifies an exact artifact.
- Runtime target: Pi Web internal tooling service only when explicitly authorized by the Operator/SRE deployment command.
- Change: draw a prominent numeric count on the dynamic favicon for the union of running root sessions and unread/completed root sessions. The 32px badge uses a 16px single-digit numeral and 14px `9+` label; running-only remains green, unread-only amber, mixed attention split green/amber, and zero count restores the original Pi favicon. Subagents are folded into their root session and suppressed subagent completions do not add attention.
- Data/migration impact: no schema, API, auth, migration, or database change.
- Invalidation: normal static/runtime artifact replacement only; no manual cache purge.
- Fresh-response validation: verify the deployed version and configured base path; exercise zero, 1, 9, and 10+ sessions; running-only, unread-only, mixed, duplicate running/unread root, and suppressed subagent fixtures. At 390, 768, and 1440px confirm no horizontal overflow; verify the favicon badge is legible at 32px, count updates without reload, reads reduce the union count, and zero restores the original icon.
- Rollback: restore the previous known-good Vanilla Runtime artifact and perform fresh login/API/port smoke checks.
- Owner: SRE/Operator for artifact publication, deployment, restart, and rollback; Coder for source evidence and UI validation.
- Limitation: no runtime deployment is performed by this source change.
