"use client";
import {useEffect,useState} from "react";

type InstalledVersion={version:string;buildNumber:string};
const storageKey="stickstat-installed-app-version";

function storedVersion():InstalledVersion|null{
  if(typeof window==="undefined")return null;try{const value=JSON.parse(localStorage.getItem(storageKey)??"null") as unknown;if(value&&typeof value==="object"&&"version" in value&&"buildNumber" in value&&typeof value.version==="string"&&typeof value.buildNumber==="string")return value as InstalledVersion}catch{return null}return null;
}

export function AppVersionFooter(){
  const [installed,setInstalled]=useState<InstalledVersion|null>(null),[latest,setLatest]=useState<string|null>(null);
  useEffect(()=>{const update=()=>setInstalled(storedVersion()),timer=window.setTimeout(update,0);window.addEventListener("stickstat-app-version",update);fetch("/api/app/releases/latest",{cache:"no-store"}).then(response=>response.json()).then(body=>setLatest(typeof body.data?.version==="string"?body.data.version:null)).catch(()=>{});return()=>{window.clearTimeout(timer);window.removeEventListener("stickstat-app-version",update)}},[]);
  return <footer className="app-version-footer"><span>{installed?`Geïnstalleerde appversie ${installed.version} (build ${installed.buildNumber})`:"Geïnstalleerde appversie is alleen zichtbaar in de Android-app"}</span>{latest&&<span>Nieuwste beschikbare versie {latest}</span>}</footer>
}
