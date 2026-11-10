import { Icon } from './Icon';
import { useEffect, useRef, useState } from 'react';

export interface ToastMessage { text: string; error?: boolean }

export function Toast({ message, onClose }: { message: ToastMessage; onClose: () => void }) {
  const close = useRef(onClose);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  useEffect(() => { close.current = onClose; }, [onClose]);
  useEffect(() => {
    if (hovered || focused) return;
    const timer = window.setTimeout(() => close.current(), message.error ? 9000 : 4500);
    return () => window.clearTimeout(timer);
  }, [message, hovered, focused]);
  return <div className={`toast ${message.error ? 'toast--error' : ''}`} role={message.error ? 'alert' : 'status'}
    onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
    onFocusCapture={() => setFocused(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
    <span>{message.text}</span>
    <button type="button" className="icon-button" onClick={onClose} aria-label="Cerrar aviso"><Icon name="close" size={18} /></button>
  </div>;
}
