"use client";
import Image from "next/image";
import {useRef} from "react";
export function ProfilePhoto({src, name, size = 92}: {src: string; name: string; size?: number}) {
  const dialog = useRef<HTMLDialogElement>(null);
  return <>
    <button className="photo-preview-button" type="button" aria-label={`Profielfoto van ${name} vergroten`} onClick={() => dialog.current?.showModal()}><Image unoptimized className="profile-photo" width={size} height={size} style={{width: size, height: size}} src={src} alt={`Profielfoto van ${name}`}/></button>
    <dialog ref={dialog} className="photo-lightbox" aria-label={`Profielfoto van ${name}`} onClick={event => {if (event.target === event.currentTarget) dialog.current?.close();}}>
      <div className="photo-lightbox-content"><button className="photo-close" type="button" aria-label="Foto sluiten" onClick={() => dialog.current?.close()}>{"\u00d7"}</button><Image unoptimized width={900} height={900} src={src} alt={`Profielfoto van ${name}`}/></div>
    </dialog>
  </>;
}
