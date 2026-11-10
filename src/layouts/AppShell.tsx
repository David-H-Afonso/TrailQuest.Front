import { useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import type { Dashboard, ProfileId } from '../models/adventure';
import type { AppUser } from '../models/account';
import { formatNumber } from '../utils/format';
import { Icon } from '../components/elements/Icon';
import { Progress } from '../components/elements/Progress';

const navigation = [
  { path: '/', label: 'Mi aventura', icon: 'compass' },
  { path: '/explore', label: 'Explorar', icon: 'map' },
  { path: '/journal', label: 'Diario', icon: 'book' },
  { path: '/passport', label: 'Pasaportes', icon: 'award' },
  { path: '/health', label: 'Salud', icon: 'heart' },
  { path: '/activities', label: 'Actividad', icon: 'activity' },
  { path: '/challenges', label: 'Retos de fuerza', icon: 'strength' },
  { path: '/friends', label: 'Amistades', icon: 'users' },
  { path: '/settings', label: 'Ajustes', icon: 'settings' },
];

export function AppShell({ user, onLogout, loggingOut, dashboard, profile, demoAvailable = true, onProfileChange, onRefresh, refreshing, children }: {
  user: AppUser; onLogout: () => void; loggingOut: boolean;
  dashboard?: Dashboard; profile: ProfileId; onProfileChange: (profile: ProfileId) => void;
  demoAvailable?: boolean;
  onRefresh: () => void; refreshing: boolean; children: ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const page = navigation.find((item) => item.path === location.pathname)?.label ?? 'TrailQuest';
  return <div className="app-shell"><a className="skip-link" href="#main-content">Saltar al contenido</a>
    <aside className={`sidebar ${menuOpen ? 'sidebar--open' : ''}`}>
      <div className="sidebar__brand-row"><Link className="brand" to="/" onClick={() => setMenuOpen(false)} aria-label="TrailQuest, ir a mi aventura"><img src="/favicon.svg" alt="" width="37" height="37" /><span>trail<span>quest</span><small>CADA PASO CUENTA</small></span></Link>
        <button type="button" className="icon-button mobile-menu-button" aria-label={menuOpen ? 'Cerrar navegación' : 'Abrir navegación'} aria-expanded={menuOpen} aria-controls="main-navigation" onClick={() => setMenuOpen(!menuOpen)}><Icon name={menuOpen ? 'close' : 'menu'} /></button></div>
      <nav className="main-navigation" id="main-navigation" aria-label="Navegación principal">{navigation.map((item) => <NavLink key={item.path} to={item.path} end={item.path === '/'} onClick={() => setMenuOpen(false)} className={({ isActive }) => `nav-item ${isActive ? 'is-active' : ''}`}><Icon name={item.icon} size={19} /><span>{item.label}</span>{item.path === '/passport' && dashboard?.currentJourney && <span className="nav-count" title="Pasaporte activo">1</span>}</NavLink>)}</nav>
      <div className="sidebar__bottom"><div className="sidebar-progress"><div><strong>Nivel {dashboard?formatNumber(dashboard.totals.level):'—'}</strong><span>{dashboard?`${formatNumber(dashboard.totals.levelXp)} / ${formatNumber(dashboard.totals.xpPerLevel)} XP`:''}</span></div><Progress value={dashboard?dashboard.totals.levelXp/dashboard.totals.xpPerLevel*100:0} label="Experiencia del nivel actual" /></div>
        <Link to="/settings" className="garmin-status"><span className={`status-dot ${dashboard?.garmin.configured ? '' : 'status-dot--muted'}`} /><span>{dashboard?.garmin.configured ? 'Garmin conectado' : 'Conectar Garmin'}</span><Icon name="chevron" size={13} /></Link>
      </div>
    </aside>
    <div className="workspace"><header className="topbar"><span className="topbar-section">{page}</span><div className="topbar__actions">{demoAvailable && <><span className="data-mode-label">{profile==='demo'?'Datos de prueba':''}</span><div className="profile-switch" role="group" aria-label="Elegir perfil de datos"><button type="button" aria-pressed={profile === 'demo'} onClick={() => onProfileChange('demo')}>Prueba</button><button type="button" aria-pressed={profile === 'personal'} onClick={() => onProfileChange('personal')}>Mis datos</button></div></>}<details className="account-menu"><summary aria-label={`Cuenta de ${user.displayName}`}><span className="account-avatar">{user.displayName.slice(0, 1).toUpperCase()}</span><span className="account-menu__name">{user.displayName}</span><Icon name="chevron" size={12} /></summary><div className="account-menu__panel"><strong>{user.displayName}</strong><span>@{user.username}</span><Link to="/settings">Mi cuenta y Garmin</Link><button type="button" onClick={onLogout} disabled={loggingOut}>{loggingOut ? 'Cerrando sesión…' : 'Cerrar sesión'}</button></div></details><button type="button" className="icon-button refresh-button" onClick={onRefresh} disabled={refreshing} aria-label="Actualizar datos"><Icon name="refresh" size={18} className={refreshing ? 'spin' : ''} /></button></div></header>
      <main className="main-content" id="main-content" tabIndex={-1}>{children}</main>
    </div>
  </div>;
}
