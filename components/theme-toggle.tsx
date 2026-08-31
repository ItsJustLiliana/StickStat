"use client";

import {Moon,Sun} from "lucide-react";
import {useSyncExternalStore} from "react";

type Theme="light"|"dark";
const storageKey="stickstat-theme";
const themeEvent="stickstat-theme-change";

function subscribe(callback:()=>void){
  window.addEventListener(themeEvent,callback);
  window.addEventListener("storage",callback);
  return ()=>{window.removeEventListener(themeEvent,callback);window.removeEventListener("storage",callback)};
}

function getTheme():Theme{return document.documentElement.dataset.theme==="dark"?"dark":"light"}
function getServerTheme():Theme{return "light"}

export function ThemeToggle(){
  const theme=useSyncExternalStore(subscribe,getTheme,getServerTheme);

  function toggle(){
    const next=theme==="dark"?"light":"dark";
    document.documentElement.dataset.theme=next;
    localStorage.setItem(storageKey,next);
    window.dispatchEvent(new Event(themeEvent));
  }

  const dark=theme==="dark";
  return <button className="theme-toggle" type="button" onClick={toggle} title={dark?"Lichte modus":"Donkere modus"} aria-label={dark?"Lichte modus inschakelen":"Donkere modus inschakelen"} aria-pressed={dark}>{dark?<Sun size={18}/>:<Moon size={18}/>}</button>;
}
