const teamSuffix=/\s+(?:(?:H|D|M|J)[A-Z]?\d+(?:-[A-Z0-9]+)?|[A-Z]+\s*\d+)$/i;
export function clubNameFromTeamName(teamName:string){const clubName=teamName.trim().replace(teamSuffix,"").trim();return clubName||teamName.trim()}
export function clubSlug(name:string){return name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"").slice(0,60)||"club"}
