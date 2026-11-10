import { act,fireEvent,render,screen } from '@testing-library/react';
import { afterEach,expect,it,vi } from 'vitest';
import { Toast } from './Toast';

afterEach(()=>vi.useRealTimers());
it('dismisses successful notices automatically',()=>{
  vi.useFakeTimers();const close=vi.fn();render(<Toast message={{text:'Guardado.'}} onClose={close}/>);
  act(()=>vi.advanceTimersByTime(4500));expect(close).toHaveBeenCalledOnce();
});
it('allows longer reading time for errors and pauses while hovered',()=>{
  vi.useFakeTimers();const close=vi.fn();render(<Toast message={{text:'No se pudo guardar.',error:true}} onClose={close}/>);
  const notice=screen.getByRole('alert');fireEvent.mouseEnter(notice);act(()=>vi.advanceTimersByTime(12000));expect(close).not.toHaveBeenCalled();
  fireEvent.mouseLeave(notice);act(()=>vi.advanceTimersByTime(8999));expect(close).not.toHaveBeenCalled();act(()=>vi.advanceTimersByTime(1));expect(close).toHaveBeenCalledOnce();
});
