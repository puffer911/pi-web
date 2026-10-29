# FSD-321 Deployment Handover

Migration required: No

## Scope

Pi Web sidebar UI only: more breathing room in the session tree and a visible
per-session overflow action that opens the existing session menu and delete
confirmation. The delete request continues to use the existing session-delete
API and running-session guard. No database, DDL, migration, cache purge,
network ACL, Tailscale, firewall, DNS, TLS, or authentication change is
required.

## Source and release

- Repository: `https://github.com/puffer911/pi-web`
- Branch at integration: `main`
- Release source commit: TBD until the Coder change is integrated
- Release path: successful GitHub Actions `Vanilla Runtime` artifact
  `pi-web-vanilla-<SHA>` with its checksum and `RELEASE-MANIFEST`
- Build/install: CI builds the exact source artifact; no npm install/build on
  the runtime target

## Target and runtime owner

- Production target: VPS production (Biznet/Ubuntu), through the FSD-319
  artifact-only runtime lane
- Runtime owner: Agent SRE
- Deployment authority: scoped SRE/Operator deployment command
- Mini PC `pi-web.service` inventory is a separate local-coding target and is
  not changed by this task

## Fresh validation plan

1. Verify the exact source SHA, successful Vanilla Runtime workflow, artifact
   checksum, and manifest before deployment.
2. Verify the session tree is more spacious at 390, 768, and 1440 viewport
   widths, with no horizontal overflow.
3. Verify the per-session overflow button is visible and usable by mouse,
   keyboard, and touch; opening it must not select the session accidentally.
4. Verify Delete requires confirmation, deletes an idle saved session, keeps a
   running session guarded, and refreshes selection/list state safely.
5. Verify existing Files, Recent, archive, pin, rename, fork, navigation, and
   status indicators remain functional.
6. Record source SHA, workflow run, checksum, target, response/browser smoke,
   screenshots, and limitations in the deployment evidence.

## Rollback and recovery

If readiness or representative browser smoke fails, SRE must restore the
previous known-good vanilla artifact/release, restart the scoped runtime, and
repeat fresh readiness and representative response checks. Do not purge global
cache. Report the failed source SHA, artifact evidence, rollback result, and
next owner through Operator.
