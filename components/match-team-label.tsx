export function MatchTeamLabel({name,own,side,className=""}:{name:string;own:boolean;side:"home"|"away";className?:string}){
  return <span className={`match-team-identity ${own?"is-own":"is-opponent"} ${className}`.trim()}><small>{own?"Mijn team":"Tegenstander"} · {side==="home"?"thuis":"uit"}</small><strong>{name}</strong></span>
}
