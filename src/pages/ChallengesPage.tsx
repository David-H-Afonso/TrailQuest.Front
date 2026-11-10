import { Link } from 'react-router-dom';
import type { Dashboard } from '../models/adventure';
import { useGetChallengesQuery } from '../services/adventureApi';
import { PageHeading } from '../components/elements/PageHeading';
import { Progress } from '../components/elements/Progress';
import { DataState } from '../components/activity/DataState';
import { formatNumber } from '../utils/format';

export function ChallengesPage({dashboard,accountId}:{dashboard:Dashboard;accountId:string}) {
  const {currentData:challenges,error,refetch}=useGetChallengesQuery({profile:dashboard.profileId,accountId});
  return <><PageHeading title="Retos de fuerza" description="Progreso acumulado con tus sesiones registradas."/>
    {!challenges?<DataState error={error} retry={()=>void refetch()}/>:<div className="challenge-grid">{challenges.map(challenge=><article className={`challenge-card panel ${challenge.completed?'is-completed':''}`} key={challenge.id}><div className="challenge-card__body"><span className="badge">{challenge.completed?'Conseguido':'En progreso'}</span><h2>{challenge.name}</h2><p>{challenge.description}</p><div className="challenge-value"><strong>{formatNumber(challenge.value)}</strong><span> / {formatNumber(challenge.target)} {challenge.unit}</span></div><Progress value={challenge.progressPercent} label={`Progreso de ${challenge.name}`}/><p className="challenge-note">{challenge.comparisonNote}</p><Link className="text-link" to="/activities">Ver actividades →</Link></div></article>)}</div>}
  </>;
}
