# TrailQuest Web 1.0.0

Private activity views, photographic passports and an independently configured web container.

- Independent frontend Git repository and `trailquest-web` image; compiled React/TypeScript, non-root Nginx and read-only filesystem support.
- Automatic GHCR builds on `main`/`master` pushes after reusable verification and image scanning, with `latest`/commit tags, digest pull commands and optional numbered releases. Pull requests only verify; no server deployment is triggered.
- Same-origin API access, runtime server-side proxy configuration and no baked-in installation accounts, passwords or IP addresses.
- Clear passport progress/stamp states, factual place sheets and credited real photography supplied by the API packs.
- Health/activity data above secondary explanations, responsive chart geometry and compact date controls.
- Backdrop/Escape modal dismissal, focus return, visible sticky actions and automatically dismissing notices.
- Working in-place share previews; optional demo cannot publish to real feeds. Personal profile by default; demo controls disappear when disabled without requiring example fixtures.
- Private date-partitioned export with API interval verification, version metadata and generated full license/credit pages.
- Visible Garmin key-generation link and instructions; replacement stays collapsed until requested. Passport leave/switch/resume confirms the single-active policy and keeps a usable empty state.
- Manual-copy fallback for one-time credentials when a LAN HTTP browser does not expose the Clipboard API.
- Date/dataset-filtered Garmin JSON export in Settings, grouped by day and ready to copy or download after review.

**Compatibility:** deploy with TrailQuest API 1.0.x and the same release's Compose contract. Passport changes require the API's `single-active` policy; older APIs cannot receive the new switching mutations. The UI also refuses to mislabel an export as date-filtered when an older API does not acknowledge the interval.

**Licensing:** original code MIT; React Leaflet Hippocratic-2.1, OFL fonts, Leaflet/Lucide notices and API photo/map terms remain separate. No central SSO, JSON restore, medical interpretation or automatic production deployment is advertised.
