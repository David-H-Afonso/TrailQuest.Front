import { useState } from 'react';
import type { AdventureMedia } from '../../models/adventure';
import { Icon } from '../elements/Icon';
import { contentAsset } from '../../utils/content';

export function MediaGallery({ adventureId, media, compact = false }: { adventureId: string; media: AdventureMedia[]; compact?: boolean }) {
  const [index, setIndex] = useState(0);
  const item = media[Math.min(index, media.length - 1)];
  if (!item) return null;
  return <section className={`media-gallery ${compact ? 'media-gallery--credit' : ''}`} aria-label="Galería de la aventura" aria-roledescription="carrusel">
    <figure>{!compact && <img src={contentAsset(adventureId, item.file)} alt={item.alt} loading="lazy" width="1280" height="853" />}
      <figcaption>{!compact && <strong>{item.caption}</strong>}<span>{item.sourceUrl ? <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer">{item.credit}</a> : item.credit} · {item.licenseUrl ? <a href={item.licenseUrl} target="_blank" rel="noopener noreferrer">{item.license}</a> : item.license}</span></figcaption></figure>
    {!compact && media.length > 1 && <div className="gallery-controls"><button type="button" className="icon-button" aria-label="Imagen anterior" disabled={index === 0} onClick={() => setIndex(index - 1)}><Icon name="chevron-left" /></button><span aria-live="polite">{index + 1} / {media.length}</span><button type="button" className="icon-button" aria-label="Imagen siguiente" disabled={index === media.length - 1} onClick={() => setIndex(index + 1)}><Icon name="chevron" /></button></div>}
  </section>;
}
