# Changelog

## 1.0.0 — unreleased candidate

First independent web-image release: clear photographic passports, compact health/activity views, repaired modal/notice/share flows, optional demo, same-origin API proxy, non-root Nginx and generated version/license inventories.

Settings includes the Garmin personal-key link and setup instructions, with replacement collapsed when connected. Passport controls confirm leave/switch/resume, show inactive history and support no-active-adventure states.

Pushes to `main`/`master` automatically verify, build, scan and publish web images to GHCR, with `latest`/branch/commit tags and optional numbered releases. Pull requests verify without publication; the workflow summary includes a digest-pinned pull command.

The image scanner uses the runner's UID/GID and private cache home so cleanup does not fail on root-owned files. Offline wrapper regressions retain the vulnerability/secret gates and error handling. The web runtime pins the Alpine `libxslt` security patch `1.1.43-r4`.

One-time integration credentials now fall back to manual copy when the Clipboard API is unavailable, including explicitly configured LAN HTTP installations.

Deploy with the paired 1.0 API/Compose contract. See [release notes](RELEASE_NOTES.md).
