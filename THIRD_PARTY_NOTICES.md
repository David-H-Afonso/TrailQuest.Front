# Third-party notices

TrailQuest's original frontend code is MIT-licensed; see `LICENSE`. That license does not relicense dependencies, photographs, font files, map data, trademarks or the backend's Garmin SDK.

The build copies the original full license/notice files into `public/licenses/` and the distributable's `licenses/`, indexed by locked package/version with SHA-256 text hashes. `licenses/index.html` is the human-readable entry; `index.json` and `bom.cdx.json` record the inventory. Build-helper licenses for Vite, Rollup and esbuild are retained conservatively. This is a declared-runtime/helper inventory, not a claim that every listed package emits code into every page.

| Component | Terms retained |
| --- | --- |
| React, React DOM, Redux Toolkit, React Redux, React Router and relevant transitives | Their original MIT notices |
| Leaflet | BSD-2-Clause |
| React Leaflet and `@react-leaflet/core` | **Hippocratic-2.1**, including its additional conditions; retain the entire supplied license, including MIT material for older portions. Not MIT-only. |
| Lucide React | ISC and the included Feather-derived MIT notices; retain the entire file |
| Bricolage Grotesque, DM Sans, IBM Plex Mono | Each font's own copyright and complete SIL Open Font License 1.1 |

Locally served route photographs and OpenStreetMap-derived geometry belong to the backend's versioned content packs. Each pack retains its `SOURCES.md`; photo sheets show author, source and license links. Credits include CC0, CC BY and CC BY-SA photographs, not a blanket MIT license. Display cropping does not remove attribution obligations. Incidental urban advertising is not offered as standalone licensed franchise artwork.

Optional map tiles come from OpenStreetMap only after the user selects a street map. Preserve visible contributor attribution and comply with https://operations.osmfoundation.org/policies/tiles/ . No bulk or offline tile acquisition is included.

The Nginx/base-image notices remain in their upstream runtime image. The backend's FIT SDK has separate Garmin terms; this frontend does not contain that assembly. The release owner is responsible for reviewing third-party conditions before public source/image distribution. A copied notice is not independent permission to redistribute restricted technology.
