import { useEffect,useRef,useState } from 'react';
import { Icon } from './Icon';

export function InlineFeedback({message,onClose,busy=false}:{message:string;onClose:()=>void;busy?:boolean}) {
  const close=useRef(onClose);
  const [paused,setPaused]=useState(false);
  useEffect(()=>{close.current=onClose;},[onClose]);
  useEffect(()=>{if(busy||paused)return;const timer=window.setTimeout(()=>close.current(),7000);return()=>window.clearTimeout(timer);},[message,busy,paused]);
  return <div className="inline-feedback" role="status" onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)} onFocusCapture={()=>setPaused(true)} onBlurCapture={event=>{if(!event.currentTarget.contains(event.relatedTarget))setPaused(false);}}><span>{message}</span><button type="button" className="icon-button" onClick={onClose} aria-label="Cerrar aviso"><Icon name="close" size={17}/></button></div>;
}
