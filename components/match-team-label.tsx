export function MatchTeamLabel({name,own,side,className=""}:{name:string;own:boolean;side:"home"|"away";className?:string}){
  const identity=own?"Mijn team":"Tegenstander",location=side==="home"?"thuis":"uit";
  return <span className={`match-team-identity ${own?"is-own":"is-opponent"} ${className}`.trim()} aria-label={`${identity}, ${location}: ${name}`} title={`${identity} · ${location}`}>{name}</span>
}
