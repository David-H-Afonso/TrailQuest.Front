import { render,screen,waitFor,within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach,expect,it,vi } from 'vitest';
import { ExplorePage } from './ExplorePage';
import { demoDashboard,routes } from '../test/fixtures';
const state=vi.hoisted(()=>({start:vi.fn()}));
vi.mock('../services/adventureApi',async importOriginal=>({...await importOriginal<typeof import('../services/adventureApi')>(),useStartJourneyMutation:()=>[state.start,{isLoading:false}]}));
beforeEach(()=>state.start.mockReset().mockReturnValue({unwrap:()=>Promise.resolve()}));

it('confirms a new passport and identifies the passport that will be left',async()=>{
  render(<MemoryRouter><ExplorePage dashboard={demoDashboard} routes={routes} onFeedback={vi.fn()}/></MemoryRouter>);
  await userEvent.click(screen.getAllByRole('button',{name:'Empezar ruta'})[0]);
  const dialog=screen.getByRole('dialog');expect(dialog).toHaveTextContent('saldrás de');expect(dialog).toHaveTextContent(routes[0].name);expect(state.start).not.toHaveBeenCalled();
  await userEvent.click(within(dialog).getByRole('button',{name:'Activar pasaporte'}));
  await waitFor(()=>expect(state.start).toHaveBeenCalledWith({profile:'demo',routeId:'mistvale',startedOn:demoDashboard.today,replacingRouteId:'tokyo'}));
});

it('activates from a legitimate no-active state without inventing a current passport',async()=>{
  render(<MemoryRouter><ExplorePage dashboard={{...demoDashboard,currentJourney:null,journeys:[]}} routes={[routes[2]]} onFeedback={vi.fn()}/></MemoryRouter>);
  await userEvent.click(screen.getByRole('button',{name:'Empezar ruta'}));
  await userEvent.click(within(screen.getByRole('dialog')).getByRole('button',{name:'Activar pasaporte'}));
  await waitFor(()=>expect(state.start).toHaveBeenCalledWith({profile:'demo',routeId:'hokkaido',startedOn:demoDashboard.today,replacingRouteId:undefined}));
});

it('does not send a switching mutation to an API without the single-active contract',async()=>{
  render(<MemoryRouter><ExplorePage dashboard={{...demoDashboard,journeyPolicy:undefined}} routes={[routes[1]]} onFeedback={vi.fn()}/></MemoryRouter>);
  await userEvent.click(screen.getByRole('button',{name:'Empezar ruta'}));await userEvent.click(within(screen.getByRole('dialog')).getByRole('button',{name:'Activar pasaporte'}));
  expect(state.start).not.toHaveBeenCalled();expect(await screen.findByRole('alert')).toHaveTextContent('Actualiza la API');
});
