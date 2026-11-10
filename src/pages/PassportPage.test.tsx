import { render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { beforeEach, expect, it, vi } from 'vitest';
import { PassportPage } from './PassportPage';
import { demoDashboard, routes } from '../test/fixtures';
import { createAppStore } from '../store';
const mutations=vi.hoisted(()=>({leave:vi.fn(),start:vi.fn()}));
vi.mock('../services/adventureApi',async importOriginal=>{
  const actual=await importOriginal<typeof import('../services/adventureApi')>();
  return {...actual,useLeaveJourneyMutation:()=>[mutations.leave,{isLoading:false}],useStartJourneyMutation:()=>[mutations.start,{isLoading:false}]};
});
beforeEach(()=>{mutations.leave.mockReset().mockReturnValue({unwrap:()=>Promise.resolve()});mutations.start.mockReset().mockReturnValue({unwrap:()=>Promise.resolve()});});

it('reads a passport from content rather than deriving a country from city/fantasy', async () => {
  const route = routes[2];
  const journey = { ...demoDashboard.currentJourney, routeId: route.id, definition: route, visits: [{ checkpointId: route.checkpoints[0].id, unlockedAtUtc: '2026-11-09T12:00:00Z' }] };
  const dashboard = { ...demoDashboard, currentJourney: journey, journeys: [journey] };
  render(<Provider store={createAppStore()}><MemoryRouter><PassportPage dashboard={dashboard} route={route} /></MemoryRouter></Provider>);
  expect(screen.getAllByText(route.passport.title).length).toBeGreaterThan(0);
  expect(screen.queryByText('BRUMAVALLE')).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: /Sapporo, inicio/ }));
  expect(screen.getByText('Este sello se añade al empezar la aventura. No requiere acumular distancia.')).toBeVisible();
  expect(screen.getByText(route.checkpoints[0].story[0])).toBeVisible();
});

it('requires confirmation before leaving and does not delete a passport on cancel', async()=>{
  const user=userEvent.setup();const feedback=vi.fn();
  render(<Provider store={createAppStore()}><MemoryRouter><PassportPage dashboard={demoDashboard} routes={routes} onFeedback={feedback}/></MemoryRouter></Provider>);
  await user.click(screen.getByRole('button',{name:'Salir del pasaporte'}));
  expect(mutations.leave).not.toHaveBeenCalled();await user.click(screen.getByRole('button',{name:'Cancelar'}));expect(mutations.leave).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button',{name:'Salir del pasaporte'}));await user.click(screen.getByRole('button',{name:'Salir y guardar avance'}));
  await waitFor(()=>expect(mutations.leave).toHaveBeenCalledWith({profile:'demo',routeId:'tokyo'}));expect(feedback).toHaveBeenCalled();
});

it('shows a real no-active state and can resume the saved passport',async()=>{
  const saved={...demoDashboard.currentJourney,isActive:false,leftAtUtc:'2026-11-09T15:00:00Z'};
  render(<Provider store={createAppStore()}><MemoryRouter><PassportPage dashboard={{...demoDashboard,currentJourney:null,journeys:[saved]}} routes={routes}/></MemoryRouter></Provider>);
  expect(screen.getByRole('heading',{name:'No tienes un pasaporte activo'})).toBeVisible();expect(screen.queryByRole('button',{name:'Salir del pasaporte'})).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole('button',{name:'Retomar pasaporte'}));await userEvent.click(within(screen.getByRole('dialog')).getByRole('button',{name:'Retomar pasaporte'}));
  await waitFor(()=>expect(mutations.start).toHaveBeenCalledWith({profile:'demo',routeId:'tokyo',replacingRouteId:undefined}));
});
