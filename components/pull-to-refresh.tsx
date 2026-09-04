"use client";
import {useEffect,useRef} from "react";
import {RefreshCw} from "lucide-react";

const refreshThreshold=64;

export function PullToRefresh(){
  const indicator=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    let startY:number|null=null,distance=0;
    const reset=()=>{startY=null;distance=0;indicator.current?.style.setProperty("--pull-distance","0px");indicator.current?.classList.remove("visible","ready")};
    const onStart=(event:TouchEvent)=>{const target=event.target,blocked=target instanceof Element&&Boolean(target.closest(".topbar, .mobile-nav, input, textarea, select, [data-no-pull-refresh]"));if(window.scrollY<=0&&event.touches.length===1&&!blocked){startY=event.touches[0].clientY;distance=0}};
    const onMove=(event:TouchEvent)=>{if(startY===null)return;const delta=event.touches[0].clientY-startY;if(delta<=0||window.scrollY>0){reset();return}event.preventDefault();distance=Math.min(88,delta*.45);indicator.current?.style.setProperty("--pull-distance",`${distance}px`);indicator.current?.classList.add("visible");indicator.current?.classList.toggle("ready",distance>=refreshThreshold)};
    const onEnd=()=>{if(startY===null)return;if(distance>=refreshThreshold){indicator.current?.classList.add("refreshing");window.location.reload();return}reset()};
    document.addEventListener("touchstart",onStart,{passive:true});document.addEventListener("touchmove",onMove,{passive:false});document.addEventListener("touchend",onEnd);document.addEventListener("touchcancel",reset);
    return()=>{document.removeEventListener("touchstart",onStart);document.removeEventListener("touchmove",onMove);document.removeEventListener("touchend",onEnd);document.removeEventListener("touchcancel",reset)};
  },[]);
  return <div ref={indicator} className="pull-refresh" aria-hidden="true"><RefreshCw size={18}/><span>Trek om te vernieuwen</span></div>
}
