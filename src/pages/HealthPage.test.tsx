import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { expect, it, vi } from 'vitest';
import { HealthPage } from './HealthPage';
import { demoDashboard } from '../test/fixtures';

vi.mock('../services/adventureApi', () => ({ useGetHealthQuery: () => ({ currentData: undefined, data: { days:[{ metrics:[{label:'PRIVATE PREVIOUS ACCOUNT'}] }] } }), useGetDocumentsQuery: vi.fn(), useGetDatasetsQuery:()=>({currentData:[]}) }));

it('does not render a previous profile/account health payload during a query transition', () => {
  render(<MemoryRouter><HealthPage dashboard={{...demoDashboard,profileId:'personal'}} accountId="new-account" /></MemoryRouter>);
  expect(screen.getByRole('heading',{name:'Cargando registros…'})).toBeVisible();
  expect(screen.queryByText('PRIVATE PREVIOUS ACCOUNT')).not.toBeInTheDocument();
});
