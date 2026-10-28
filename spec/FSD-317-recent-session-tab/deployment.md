# FSD-317 Deployment Handover

Migration required: No

## Scope

Pi Web static/UI runtime artifact for the Recent sidebar tab. No database,
DDL, migration, cache purge, network ACL, Tailscale, firewall, DNS, TLS, or
authentication change is required by this feature.

## Source

- Repository: `https://github.com/puffer911/pi-web`
- Release source commit: `bd45f88964a52c74f12f2dfcbf25ba1d0190050f`
- Branch at integration: `main`
- Build: `npm ci` followed by `npm run build`
- Image/tag: not applicable; this deployment uses the built Pi Web package
  artifact, not a container image.

## Target and runtime owner

- Production target: VPS production (Biznet/Ubuntu)
- Runtime service: Pi Web on port `30141`
- Runtime owner: Agent SRE
- Deployment authority: scoped SRE/Operator deployment command
- Current Mini PC service remains the pre-deployment global package and is
  persistent under `pi-web.service`; the bounded fork validation on port
  `30142` was stopped.

SRE must install the fork artifact using the approved versioned release/backup
procedure and update the runtime launcher only as part of the deployment
command. Do not overwrite the only rollback copy in place.

## Validation and fresh-response plan

1. Verify the exact source commit and built artifact before changing runtime.
2. Record the current known-good package/launcher as rollback reference.
3. Stop/restart only the scoped Pi Web service; do not change the persistent
   service's Tailscale binding or port.
4. Verify `systemctl is-active pi-web.service`, the Tailscale listener on
   `:30141`, and the expected unauthenticated HTTP response (`307 /login` in
   the current environment).
5. After authenticated browser access, set **File browser → Separate tab** and
   verify **Recent | Sessions | Files**, cross-agent/project rows, status dots,
   row navigation, and existing Sessions/Files behavior at 390, 768, and 1440
   viewport widths.
6. Capture commit, target, start/finish time, response checks, browser/device,
   screenshots, and any limitation in the deployment evidence.

No global cache purge is authorized. If static assets appear stale, use a
bounded fresh browser/request verification first; any cache action needs its
own namespace/keyspace, authority, rollback, and response evidence.

## Rollback and recovery

If readiness or representative UI smoke fails, SRE must stop the new runtime,
restore the recorded known-good package/launcher, restart `pi-web.service`, and
repeat listener plus `/login` fresh-response verification. Report the failed
commit, target, evidence, rollback result, and next owner through Operator.

## Current handover status

Coder implementation and Mini PC bounded validation are complete. Production
installation/restart is pending a separate scoped SRE deployment command.
