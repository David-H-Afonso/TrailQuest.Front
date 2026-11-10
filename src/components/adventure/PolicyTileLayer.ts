import { TileLayer, type Coords, type DoneCallback, type Map as LeafletMap } from 'leaflet';

export type MapFailure = 'blocked' | 'unavailable';
export const osmAttribution = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors';

// Fetch once per visible tile, honoring browser HTTP caching and OSM identification rules.
// Checking the HTTP status prevents a provider's 403 image from becoming the basemap.
export class PolicyTileLayer extends TileLayer {
  private readonly pending = new globalThis.Map<HTMLImageElement, AbortController>();
  private readonly objectUrls = new globalThis.Map<HTMLImageElement, string>();
  private reportedFailure = false;

  constructor(private readonly onFailure: (failure: MapFailure) => void) {
    super('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: osmAttribution, keepBuffer: 0 });
    this.on('tileunload', (event) => this.release((event as { tile: HTMLImageElement }).tile));
  }

  override createTile(coords: Coords, done: DoneCallback): HTMLElement {
    const tile = document.createElement('img');
    tile.alt = '';
    tile.setAttribute('role', 'presentation');
    tile.referrerPolicy = 'strict-origin-when-cross-origin';
    const controller = new AbortController();
    this.pending.set(tile, controller);
    const fail = (failure: MapFailure) => {
      if (controller.signal.aborted) return;
      done(new Error('Map tile unavailable.'), tile);
      if (!this.reportedFailure) { this.reportedFailure = true; this.onFailure(failure); }
    };
    void fetch(this.getTileUrl(coords), {
      credentials: 'omit', cache: 'default', mode: 'cors',
      referrerPolicy: 'strict-origin-when-cross-origin', signal: controller.signal,
    }).then(async (response) => {
      if (!response.ok) { fail(response.status === 403 || response.status === 429 ? 'blocked' : 'unavailable'); return; }
      const image = await response.blob();
      if (!image.type.startsWith('image/') || image.size > 2 * 1024 * 1024) { fail('unavailable'); return; }
      if (controller.signal.aborted) return;
      const url = URL.createObjectURL(image);
      this.objectUrls.set(tile, url);
      tile.onload = () => { this.releaseUrl(tile); this.pending.delete(tile); done(undefined, tile); };
      tile.onerror = () => { this.releaseUrl(tile); fail('unavailable'); };
      tile.src = url;
    }).catch(() => fail('unavailable'));
    return tile;
  }

  override onRemove(map: LeafletMap): this {
    for (const tile of this.pending.keys()) this.release(tile);
    for (const tile of this.objectUrls.keys()) this.releaseUrl(tile);
    return super.onRemove(map);
  }

  private release(tile: HTMLImageElement) {
    this.pending.get(tile)?.abort();
    this.pending.delete(tile);
    this.releaseUrl(tile);
  }

  private releaseUrl(tile: HTMLImageElement) {
    const url = this.objectUrls.get(tile);
    if (url) { URL.revokeObjectURL(url); this.objectUrls.delete(tile); }
  }
}
