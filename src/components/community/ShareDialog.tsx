import { useEffect, useState } from 'react';
import type { ProfileId } from '../../models/adventure';
import type { Post, ShareRequest } from '../../models/health';
import { usePreviewShareMutation, usePublishShareMutation } from '../../services/adventureApi';
import { Modal } from '../elements/Modal';
import { Button } from '../elements/Button';
import { TrackSchematic } from '../activity/MetricChart';
import type { ToastMessage } from '../elements/Toast';
import { getErrorMessage } from '../../utils/errors';

export function ShareDialog({ request, profile, onClose, onPublished }: {
  request: ShareRequest; profile: ProfileId; onClose: () => void; onPublished?: (message: ToastMessage) => void;
}) {
  const [prepare] = usePreviewShareMutation();
  const [publish, { isLoading: publishing }] = usePublishShareMutation();
  const [post, setPost] = useState<Post | null>(null);
  const [error, setError] = useState('');
  const { kind, sourceId, checkpointId, includeTrack } = request;
  useEffect(() => {
    let active = true;
    const pending = prepare({ kind, sourceId, checkpointId, includeTrack, profileId: profile });
    pending.unwrap().then(value => { if (active) setPost(value); }).catch(failure => { if (active) setError(getErrorMessage(failure)); });
    return () => { active = false; pending.abort(); };
  }, [prepare, kind, sourceId, checkpointId, includeTrack, profile]);
  async function confirm() {
    setError('');
    try { await publish({ ...request, profileId: profile }).unwrap(); onPublished?.({ text: 'Publicación compartida.' }); onClose(); }
    catch (failure) { setError(getErrorMessage(failure)); }
  }
  return <Modal title="Compartir" onClose={onClose} className="share-dialog">
    {error ? <p className="form-error" role="alert">{error}</p> : !post ? <p role="status">Preparando vista previa…</p> : <>
      <p className="share-audience">{profile === 'demo' ? 'Vista previa de prueba · no se publica' : 'Visible para tus amistades'}</p>
      <article className="publication-preview"><header><span className="account-avatar">{post.displayName.slice(0,1)}</span><strong>{post.displayName}</strong></header><h3>{post.title}</h3><p>{post.summary}</p>{post.track.length > 0 && <TrackSchematic points={post.track} />}</article>
      <div className="modal__actions"><Button variant="secondary" onClick={onClose}>{profile === 'demo' ? 'Cerrar vista previa' : 'Cancelar'}</Button>{profile === 'personal' && <Button onClick={() => void confirm()} loading={publishing}>Publicar</Button>}</div>
    </>}
  </Modal>;
}
