type MatchStat={matchId:string;goals:number;assists:number;saves:number;mvp:boolean};
type MatchEvent={matchId:string;type:string;playerId:string|null;relatedPlayerId:string|null};

export function playerMatchPerformances<T extends {date: Date}>(playerId:string,stats:(MatchStat & {match:T})[],events:(MatchEvent & {match:T})[]){
  const matches=new Map([...stats,...events].map(item=>[item.matchId,item.match]));
  return [...matches].map(([matchId,match])=>({matchId,match,...playerTotals(playerId,stats.filter(stat=>stat.matchId===matchId),events.filter(event=>event.matchId===matchId))})).sort((a,b)=>a.match.date.getTime()-b.match.date.getTime());
}

export function playerTotals(playerId:string,stats:MatchStat[],events:MatchEvent[]){
  const eventMatches={goals:new Set<string>(),assists:new Set<string>(),saves:new Set<string>(),mvps:new Set<string>()};
  let goals=0,assists=0,saves=0,mvps=0;
  for(const event of events){
    if(event.type==="goal"&&event.playerId===playerId){goals++;eventMatches.goals.add(event.matchId)}
    if(event.type==="goal"&&event.relatedPlayerId===playerId){assists++;eventMatches.assists.add(event.matchId)}
    if(event.type==="save"&&event.playerId===playerId){saves++;eventMatches.saves.add(event.matchId)}
    if(event.type==="mvp"&&event.playerId===playerId){mvps++;eventMatches.mvps.add(event.matchId)}
  }
  return {goals:goals+stats.filter(stat=>!eventMatches.goals.has(stat.matchId)).reduce((sum,stat)=>sum+stat.goals,0),assists:assists+stats.filter(stat=>!eventMatches.assists.has(stat.matchId)).reduce((sum,stat)=>sum+stat.assists,0),saves:saves+stats.filter(stat=>!eventMatches.saves.has(stat.matchId)).reduce((sum,stat)=>sum+stat.saves,0),mvps:mvps+stats.filter(stat=>!eventMatches.mvps.has(stat.matchId)&&stat.mvp).length};
}
