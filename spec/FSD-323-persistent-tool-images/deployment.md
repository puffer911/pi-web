# FSD-323 Deployment Handover

Migration required: No

## Scope

Pi Web chat presentation only: keep a process-details group open when it contains
an image-bearing tool result, so screenshots and other tool media remain visible
after a final text answer. The existing lazy session image endpoint, MIME/size
limits, session authorization, and manual collapse control remain unchanged.
No database, DDL, migration, cache purge, network ACL, Tailscale, firewall, DNS,
TLS, or authentication change is required.

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
2. Verify a synthetic image-bearing tool result remains visible after a final
   answer, session reload, and session reopen at 390, 768, and 1440 viewport
   widths.
3. Verify the process group remains manually collapsible and the image preview
   still opens from its button.
4. Verify the existing lazy image route still enforces session/entry/block
   lookup, supported MIME types, and the bounded payload size.
5. Record source SHA, workflow run, checksum, target, response/browser smoke,
   screenshots, and limitations in deployment evidence.

## Rollback and recovery

If readiness or representative browser smoke fails, SRE must restore the
previous known-good vanilla artifact/release, restart the scoped runtime, and
repeat fresh readiness and representative response checks. Do not purge global
cache. Report the failed source SHA, artifact evidence, rollback result, and next
owner through Operator.
