import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Icon } from './Icon';

export function Modal({ title, eyebrow, onClose, children, className = '' }: {
  title: string; eyebrow?: string; onClose: () => void; children: ReactNode; className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const close = useRef(onClose);
  useEffect(() => { close.current = onClose; }, [onClose]);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    let pointerStartedOutside = false;
    const outside = (x: number,y: number) => { const bounds=dialog.getBoundingClientRect();return x<bounds.left||x>bounds.right||y<bounds.top||y>bounds.bottom; };
    const pointerDown = (event: PointerEvent) => { pointerStartedOutside=event.target===dialog&&outside(event.clientX,event.clientY); };
    const backdropClick = (event: MouseEvent) => { if(event.target===dialog&&pointerStartedOutside&&outside(event.clientX,event.clientY))close.current();pointerStartedOutside=false; };
    dialog.addEventListener('pointerdown',pointerDown);
    dialog.addEventListener('click',backdropClick);
    dialog.showModal();
    return () => {
      dialog.removeEventListener('pointerdown',pointerDown);
      dialog.removeEventListener('click',backdropClick);
      if (dialog?.open) dialog.close();
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, []);

  return (
    <dialog ref={ref} className={`modal ${className}`} aria-labelledby={titleId}
      onCancel={(event) => { event.preventDefault(); onClose(); }}>
      <header className="modal__header">
        <div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h2 id={titleId}>{title}</h2></div>
        <button type="button" className="icon-button" onClick={onClose} aria-label="Cerrar ventana"><Icon name="close" /></button>
      </header>
      <div className="modal__body">{children}</div>
    </dialog>
  );
}
