import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Modal } from './Modal';

function DialogFixture() {
  const [open, setOpen] = useState(false);
  return <><button onClick={() => setOpen(true)}>Abrir detalle</button>{open && <Modal title="Un lugar" onClose={() => setOpen(false)}><p>El camino continúa.</p></Modal>}</>;
}

describe('dialog focus restoration', () => {
  it('closes on a backdrop click but not on an inside-to-outside drag',async()=>{
    render(<DialogFixture/>);const opener=screen.getByRole('button',{name:'Abrir detalle'});await userEvent.click(opener);
    const dialog=screen.getByRole('dialog');vi.spyOn(dialog,'getBoundingClientRect').mockReturnValue({left:100,top:100,right:500,bottom:400,width:400,height:300,x:100,y:100,toJSON:()=>({})});
    fireEvent(dialog,Object.assign(new Event('pointerdown',{bubbles:true}),{clientX:150,clientY:150}));fireEvent.click(dialog,{clientX:10,clientY:10});expect(dialog).toBeInTheDocument();
    fireEvent(dialog,Object.assign(new Event('pointerdown',{bubbles:true}),{clientX:10,clientY:10}));fireEvent.click(dialog,{clientX:10,clientY:10});expect(screen.queryByRole('dialog')).not.toBeInTheDocument();expect(opener).toHaveFocus();
  });
  it('returns focus to the opener after its close action', async () => {
    const user = userEvent.setup();
    render(<DialogFixture />);
    const opener = screen.getByRole('button', { name: 'Abrir detalle' });
    await user.click(opener);
    await user.click(screen.getByRole('button', { name: 'Cerrar ventana' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });
  it('returns focus after the native cancel event used by Escape', async () => {
    render(<DialogFixture />);
    const opener = screen.getByRole('button', { name: 'Abrir detalle' });
    await userEvent.click(opener);
    fireEvent(screen.getByRole('dialog'), new Event('cancel', { bubbles: false, cancelable: true }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });
});
