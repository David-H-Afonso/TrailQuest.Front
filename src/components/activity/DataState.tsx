import { Link } from 'react-router-dom';
import { Button } from '../elements/Button';
import { Icon } from '../elements/Icon';
import { getErrorMessage } from '../../utils/errors';

export function DataState({ error, retry, empty = false, title = 'Todavía no hay registros.' }: { error?: unknown; retry?: () => void; empty?: boolean; title?: string }) {
  return <section className="data-state panel" role={error ? 'alert' : 'status'}>{!error&&!empty&&<Icon name="loader" size={24} className="spin" />}<h2>{error ? 'No se pudieron cargar los datos' : empty ? title : 'Cargando registros…'}</h2>{error ? <p>{getErrorMessage(error)}</p> : empty && <p>Conecta Garmin o importa una actividad para empezar.</p>}{error && retry ? <Button variant="secondary" onClick={retry}>Reintentar</Button> : empty && <Link className="button button--secondary" to="/settings">Conectar Garmin</Link>}</section>;
}
export function DemoNotice({ demo }: { demo: boolean }) {
  return demo ? <span className="sr-only">Datos de prueba.</span> : null;
}
