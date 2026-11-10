import { useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Dashboard } from '../models/adventure';
import type { Post, ShareRequest } from '../models/health';
import { useAcceptFriendMutation, useBlockUserMutation, useDeletePostMutation, useGetChallengesQuery, useGetCommunityQuery, useGetHealthQuery, usePreviewShareMutation, usePublishShareMutation, useRemoveFriendMutation, useRequestFriendMutation } from '../services/adventureApi';
import { PageHeading } from '../components/elements/PageHeading';
import { Button } from '../components/elements/Button';
import { Icon } from '../components/elements/Icon';
import { DataState, DemoNotice } from '../components/activity/DataState';
import { TrackSchematic } from '../components/activity/MetricChart';
import { formatDate } from '../utils/format';
import { getErrorMessage } from '../utils/errors';
import { InlineFeedback } from '../components/elements/InlineFeedback';
import { ShareDialog } from '../components/community/ShareDialog';

export function FriendsPage({ dashboard, accountId }: { dashboard: Dashboard; accountId: string }) {
  const [params,setParams] = useSearchParams();
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [selection, setSelection] = useState<ShareRequest>({ kind: params.get('kind') ?? 'activity', sourceId: params.get('sourceId') ?? '', checkpointId: params.get('checkpointId') ?? undefined, includeTrack: false });
  const [preview, setPreview] = useState<Post | null>(null);
  const demo = dashboard.profileId === 'demo';
  const { currentData: data, error, refetch } = useGetCommunityQuery({ profile: dashboard.profileId, accountId });
  const { currentData: health } = useGetHealthQuery({ profile: dashboard.profileId, accountId });
  const { currentData: challenges } = useGetChallengesQuery({ profile: dashboard.profileId, accountId });
  const [requestFriend, requesting] = useRequestFriendMutation();
  const [accept] = useAcceptFriendMutation(); const [remove] = useRemoveFriendMutation(); const [block] = useBlockUserMutation();
  const [prepare, preparing] = usePreviewShareMutation(); const [publish, publishing] = usePublishShareMutation(); const [deletePost] = useDeletePostMutation();
  const stamps = dashboard.journeys.flatMap(journey => (journey.definition?.checkpoints ?? []).filter(stop => journey.visits.some(x => x.checkpointId === stop.id)).map(stop => ({ value: `${journey.routeId}/${stop.id}`, label: `${journey.definition?.passport.title} · ${stop.name}` })));
  const completed = dashboard.journeys.filter(x => x.progressPercent >= 100);
  async function act(action: () => Promise<unknown>, success: string) { setMessage(''); try { await action(); setMessage(success); } catch (failure) { setMessage(getErrorMessage(failure)); } }
  function update(next: ShareRequest) { setSelection(next); setPreview(null); }
  async function sendRequest(event: FormEvent) { event.preventDefault(); await act(() => requestFriend(username).unwrap(), 'Solicitud enviada. La otra persona debe aceptarla.'); setUsername(''); }
  return <><PageHeading title="Amistades" /><DemoNotice demo={demo} />
    {message && <InlineFeedback message={message} onClose={()=>setMessage('')}/>}
    <div className="community-layout"><div className="community-feed">
      {!data ? <DataState error={error} retry={() => void refetch()} /> : data.posts.length === 0 ? <section className="data-state panel"><Icon name="users" size={32} /><h2>Este espacio todavía está en blanco.</h2><p>Añade una amistad o prepara una publicación. Nada se comparte automáticamente al sincronizar Garmin.</p></section> : data.posts.map(post => <article className="feed-post panel" key={post.id}><header><span className="account-avatar">{post.displayName.slice(0,1)}</span><div><strong>{post.displayName}</strong><span>{formatDate(post.createdAtUtc.slice(0,10))} · {demo ? 'Ejemplo ficticio' : 'Solo amistades'}</span></div><Icon name={post.kind === 'activity' ? 'activity' : 'award'} /></header><h2>{post.title}</h2><p>{post.summary}</p>{post.track.length > 0 && <TrackSchematic points={post.track} />}{post.isOwn && !demo && <Button variant="ghost" onClick={() => void act(() => deletePost(post.id).unwrap(), 'Publicación retirada.')}>Retirar publicación</Button>}</article>)}
    </div><aside className="community-sidebar">
      {demo ? <section className="health-panel panel"><h2>Compartir</h2><p>Abre un sello o una actividad y pulsa Compartir para ver la tarjeta. En Prueba no se publica para otras cuentas.</p></section> : <>
        <section className="health-panel panel"><div className="section-label"><h2>Tus amistades</h2><Icon name="users" /></div><form className="form-stack" onSubmit={event => void sendRequest(event)}><label className="field">Nombre de usuario exacto<input value={username} maxLength={32} onChange={event => setUsername(event.target.value)} required autoComplete="off" /></label><Button type="submit" variant="secondary" loading={requesting.isLoading}>Enviar solicitud</Button></form><div className="friend-list">{data?.friends.map(friend => <div className="friend-row" key={friend.id}><strong>{friend.displayName}</strong><small>{friend.status === 'accepted' ? 'Amistad aceptada' : friend.incoming ? 'Te ha enviado una solicitud' : 'Solicitud pendiente'}</small><div className="inline-actions">{friend.status === 'pending' && friend.incoming && <Button compact onClick={() => void act(() => accept(friend.id).unwrap(), 'Amistad aceptada.')}>Aceptar</Button>}<Button compact variant="ghost" onClick={() => void act(() => remove(friend.id).unwrap(), 'Relación retirada. El acceso a las publicaciones se ha revocado.')}>{friend.status === 'accepted' ? 'Dejar de compartir' : 'Retirar'}</Button><Button compact variant="ghost" onClick={() => void act(() => block(friend.userId).unwrap(), 'Usuario bloqueado y amistad retirada.')}>Bloquear</Button></div></div>)}</div></section>
        <section className="health-panel panel"><div className="section-label"><h2>Compartir un recuerdo</h2><Icon name="share" /></div><div className="form-stack"><label className="field">Tipo<select value={selection.kind} onChange={event => update({ kind: event.target.value, sourceId: '', includeTrack: false })}><option value="activity">Una actividad</option><option value="checkpoint">Un sello descubierto</option><option value="journey">Un pasaporte completo</option><option value="challenge">Un reto de fuerza alcanzado</option></select></label>
          {selection.kind === 'activity' && <label className="field">Actividad<select value={selection.sourceId} onChange={event => update({ ...selection, sourceId: event.target.value })}><option value="">Elige una actividad</option>{health?.activities.map(x => <option value={x.id} key={x.id}>{x.name}</option>)}</select></label>}
          {selection.kind === 'checkpoint' && <label className="field">Sello<select value={selection.sourceId && selection.checkpointId ? `${selection.sourceId}/${selection.checkpointId}` : ''} onChange={event => { const [sourceId, checkpointId] = event.target.value.split('/'); update({ ...selection, sourceId, checkpointId }); }}><option value="">Elige un sello</option>{stamps.map(x => <option value={x.value} key={x.value}>{x.label}</option>)}</select></label>}
          {selection.kind === 'journey' && <label className="field">Pasaporte<select value={selection.sourceId} onChange={event => update({ ...selection, sourceId: event.target.value })}><option value="">Elige un pasaporte completo</option>{completed.map(x => <option value={x.routeId} key={x.routeId}>{x.definition?.passport.title ?? x.routeId}</option>)}</select></label>}
          {selection.kind === 'challenge' && <label className="field">Reto<select value={selection.sourceId} onChange={event => update({ ...selection, sourceId: event.target.value })}><option value="">Elige un reto alcanzado</option>{challenges?.filter(x => x.completed).map(x => <option value={x.id} key={x.id}>{x.name}</option>)}</select></label>}
          {selection.kind === 'activity' && <label className="inline-check"><input type="checkbox" checked={selection.includeTrack} onChange={event => update({ ...selection, includeTrack: event.target.checked })} />Incluir trazado recortado, si existe</label>}
          <p className="field-help">El servidor elimina puntos a menos de 500 m del inicio y el final y retira sus horas. Esto reduce exposición, pero no garantiza anonimato. Sin marcar la casilla no se comparte ningún trazado.</p>
          <Button variant="secondary" disabled={!selection.sourceId} loading={preparing.isLoading} onClick={() => void act(async () => { setPreview(await prepare(selection).unwrap()); }, 'Vista previa preparada. Todavía no se ha publicado.')}>Ver exactamente qué se comparte</Button>
          {preview && <div className="share-preview"><span className="eyebrow">Vista previa · amistades actuales</span><h3>{preview.title}</h3><p>{preview.summary}</p>{preview.track.length > 0 && <TrackSchematic points={preview.track} />}<Button icon="share" loading={publishing.isLoading} onClick={() => void act(async () => { await publish(selection).unwrap(); setPreview(null); }, 'Publicación compartida solo con tus amistades.')}>Confirmar publicación</Button></div>}
        </div></section>
      </>}
    </aside></div>
    {demo&&params.get('kind')&&params.get('sourceId')&&<ShareDialog request={selection} profile="demo" onClose={()=>setParams({})}/>}
  </>;
}
