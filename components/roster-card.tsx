import Image from "next/image";
import Link from "next/link";

export type RosterPerson={key:string;name:string;photoPath:string|null;subtitle:string;href?:string;shirtNumber?:number|null;matches?:number;goals?:number;assists?:number};

export function RosterCard({person}:{person:RosterPerson}){
  const content=<><div className="player-top">{person.photoPath?<Image unoptimized width={52} height={52} className="player-photo image" src={person.photoPath} alt={`Profielfoto van ${person.name}`}/>:<div className="player-photo">{person.name.split(/\s+/).map(part=>part[0]).join("").slice(0,2).toUpperCase()}</div>}<div><strong>{person.name}</strong><div className="muted" style={{fontSize:12,marginTop:4}}>{person.subtitle}</div></div>{person.shirtNumber!==undefined&&<span className="player-number">{person.shirtNumber??"–"}</span>}</div>{person.matches!==undefined&&<div className="stat-strip"><div><strong>{person.matches}</strong><span>Wedstrijden</span></div><div><strong>{person.goals}</strong><span>Goals</span></div><div><strong>{person.assists}</strong><span>Assists</span></div><div><strong>{(person.goals??0)+(person.assists??0)}</strong><span>G+A</span></div></div>}</>;
  return person.href?<Link className="player-card" href={person.href}>{content}</Link>:<article className="player-card">{content}</article>;
}
