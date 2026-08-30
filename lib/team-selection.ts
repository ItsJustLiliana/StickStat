export function selectPreferredTeam<T extends {id:string}>(teams:T[],requestedId:string|undefined,linkedPlayerTeamId:string|undefined,membershipTeamIds:string[]){
  return teams.find(team=>team.id===requestedId)
    ??teams.find(team=>team.id===linkedPlayerTeamId)
    ??membershipTeamIds.map(teamId=>teams.find(team=>team.id===teamId)).find((team):team is T=>Boolean(team))
    ??teams[0]
    ??null;
}
