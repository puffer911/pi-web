# FSD-397 deployment handover

- Migration required: No
- Source repository: `https://github.com/puffer911/pi-web`
- Branch: `main`
- Source commit: `3a1ed06398b38d140260b4cf64cbb5a1b904b944`
- Target artifact/tag: FSD-319 Vanilla Runtime artifact for the exact source commit; default release selector is `latest` unless the Operator/SRE command specifies an exact artifact.
- Runtime target: Pi Web internal tooling service only when explicitly authorized by the Operator/SRE deployment command.
- Change: replace the colored dot with a large standalone count glyph on the dynamic favicon for the union of running root sessions and unread/completed root sessions. On a transparent 32px canvas, single digits use a 25px font and `9+` uses 18px, with dual-contrast outlines. Running-only is green, unread-only amber, and mixed attention splits the numeral green/amber; zero count restores the original Pi favicon. Subagents are folded into their root session and suppressed subagent completions do not add attention.
- Data/migration impact: no schema, API, auth, migration, or database change.
- Invalidation: normal static/runtime artifact replacement only; no manual cache purge.
- Fresh-response validation: verify the deployed version and configured base path; exercise zero, 1, 9, and 10+ sessions; running-only, unread-only, mixed, duplicate running/unread root, and suppressed subagent fixtures. At 390, 768, and 1440px confirm no horizontal overflow; verify the standalone number (not a dot/bubble) is legible at 32px on light/dark tab backgrounds, count updates without reload, reads reduce the union count, and zero restores the original icon.
- Rollback: restore the previous known-good Vanilla Runtime artifact and perform fresh login/API/port smoke checks.
- Owner: SRE/Operator for artifact publication, deployment, restart, and rollback; Coder for source evidence and UI validation.
- Limitation: no runtime deployment is performed by this source change.
