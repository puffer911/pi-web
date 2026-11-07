# FSD-401 — Batas cache SessionManager read-only

Migration required: No

## Scope dan dampak
- Perubahan hanya membatasi cache `SM_CACHE` in-memory pada proses Pi Web: maksimum 24 MiB per session, 100 MiB agregat, dan 12 entry dengan LRU tetap.
- Cache adalah wrapper `SessionManager` read-only di `lib/session-reader.ts`; tidak ada Redis/keyspace/cache eksternal, migrasi schema, API/auth change, atau mutation session JSONL/DB.
- Restart `pi-web-vanilla.service` mengosongkan cache proses; cache akan terisi ulang secara normal saat dibaca. Tidak perlu purge manual.
- Host/environment target pada perintah ini: Mini PC Debian `minideb`, runtime lokal Web Vanilla. Bukan VPS/production.

## Release dan prosedur
- Owner: Agent SRE. Authority: instruksi Operator dan task deployment FSD-402.
- Build wajib memakai artifact exact GitHub Actions `Vanilla Runtime` dari SHA `main` final setelah dokumen ini terintegrasi. Verifikasi run sukses, SHA, checksum, dan `RELEASE-MANIFEST`; jangan build lokal atau memakai artifact SHA lain.
- Simpan artifact/provenance di `/root/working-repo/artifacts/tooling/<session>/`; jangan mengubah `/etc/pi-web/pi-web.env` atau konfigurasi Tailscale/network.
- Stage artifact ke `/opt/pi-web-vanilla/releases/<SHA>`, verifikasi manifest, lalu atomik switch `/opt/pi-web-vanilla/current` dan restart `pi-web-vanilla.service`.
- Cache impact terbatas ke cache in-memory service tersebut. Tidak ada namespace/keyspace eksternal atau invalidation action; tidak melakukan purge global maupun memodifikasi file session.
- Fresh validation: service active; listener tetap di IPv4 Tailscale terverifikasi port `30141`; exact release SHA/manifest; `GET /pi-web/` menghasilkan HTTP 200. Catat waktu restart dan hasil.

## Risiko, recovery, dan rollback
- Risiko utama: jeda singkat saat restart dan cache read-only kosong sampai dihangatkan ulang; session JSONL dan state session aktif tidak diubah.
- Known-good sebelum cutover: `/opt/pi-web-vanilla/releases/a488d2808e05282aed7f53416230c6710a2baf5a`.
- Bila service atau fresh-response validation gagal, atomik kembalikan `current` ke known-good tersebut, restart service, lalu verifikasi ulang status, listener, dan HTTP 200. Jangan retry restart/cutover secara buta.
- Tidak ada perubahan data, DB, Tailscale ACL, firewall, DNS/TLS, atau service VPS.
