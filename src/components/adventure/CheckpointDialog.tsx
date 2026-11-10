import { useState } from 'react';
import type { AdventureRoute, Checkpoint, Journey, ProfileId } from '../../models/adventure';
import { formatKm } from '../../utils/format';
import { Modal } from '../elements/Modal';
import { Button } from '../elements/Button';
import type { ToastMessage } from '../elements/Toast';
import { ShareDialog } from '../community/ShareDialog';
import { MediaGallery } from './MediaGallery';
import { contentAsset } from '../../utils/content';

export function CheckpointDialog({ stop, route, journey, profile = 'personal', onClose, onFeedback }: {
  stop: Checkpoint; route: AdventureRoute; journey: Journey; profile?: ProfileId; onClose: () => void; onFeedback?: (message: ToastMessage) => void;
}) {
  const [sharing, setSharing] = useState(false);
  const unlocked = journey.visits.some(visit => visit.checkpointId === stop.id);
  const start = stop.distanceKm === 0;
  const remaining = Math.max(0, stop.distanceKm - journey.distanceKm);
  const photo = stop.image ?? stop.gallery?.[0]?.file;
  return <Modal title={stop.name} eyebrow={route.region} onClose={onClose} className="checkpoint-dialog checkpoint-sheet">
    {photo && <figure className="checkpoint-photo"><img src={contentAsset(route.id,photo)} alt={stop.gallery?.[0]?.alt ?? stop.name} width="1280" height="853" /></figure>}
    <div className={`checkpoint-state ${unlocked ? 'is-earned' : ''}`}><strong>{unlocked ? start ? 'Sello de inicio' : 'Sello conseguido' : 'Sello pendiente'}</strong><span>{start ? '0 km · salida' : `${formatKm(stop.distanceKm)} de recorrido`}</span></div>
    <p className="checkpoint-requirement">{unlocked ? start ? 'Este sello se añade al empezar la aventura. No requiere acumular distancia.' : `Has superado los ${formatKm(stop.distanceKm)} necesarios para este sello.` : `Te faltan ${formatKm(remaining)} para conseguirlo. Llevas ${formatKm(journey.distanceKm)} en esta ruta.`}</p>
    {unlocked ? <><div className="place-description"><p className="place-lead">{stop.description}</p>{stop.story?.map((paragraph,index) => <p key={index}>{paragraph}</p>)}</div>{stop.fact && <aside className="place-fact"><strong>{route.setting === 'fiction' ? 'Sobre este lugar' : 'Dato del lugar'}</strong><p>{stop.fact}</p></aside>}
      {stop.gallery?.length > 0 && <MediaGallery adventureId={route.id} media={stop.gallery} compact />}
      <div className="modal__actions"><Button variant="secondary" onClick={onClose}>Cerrar</Button><Button onClick={() => setSharing(true)}>Compartir sello</Button></div>
    </> : <div className="modal__actions"><Button variant="secondary" onClick={onClose}>Cerrar</Button></div>}
    {sharing && <ShareDialog request={{kind:'checkpoint',sourceId:route.id,checkpointId:stop.id,includeTrack:false}} profile={profile} onClose={() => setSharing(false)} onPublished={message => { onFeedback?.(message); onClose(); }} />}
  </Modal>;
}
