import * as cheerio from "cheerio";
import type {ExternalMatch,ExternalStanding,ExternalTeam,HockeyDataProvider} from "./types";

const baseUrl="https://hockeystanden.nl/team/";
const number=(value:string)=>Number.parseInt(value.trim(),10)||0;

export class HockeyStandenProvider implements HockeyDataProvider{
  async html(identifier:string){
    const response=await fetch(baseUrl+encodeURI(identifier),{headers:{"user-agent":"StickStat/1.0 (+self-hosted hockey statistics)"},signal:AbortSignal.timeout(15000),cache:"no-store"});
    if(!response.ok)throw new Error(`Hockeystanden HTTP ${response.status}`);
    return response.text();
  }
  async getClub(identifier:string){const team=await this.getTeam(identifier);return team?.clubName?{name:team.clubName,logoUrl:team.logoUrl}:null}
  async getTeam(identifier:string){return parseHockeyStandenTeam(await this.html(identifier))}
  async getMatches(identifier:string){return parseHockeyStandenMatches(await this.html(identifier))}
  async getStandings(identifier:string){return parseHockeyStandenStandings(await this.html(identifier))}
}

function jsonLd($:cheerio.CheerioAPI){
  return $("script[type='application/ld+json']").map((_,el)=>{try{return JSON.parse($(el).text())}catch{return null}}).get().flat().filter(Boolean) as Array<Record<string,unknown>>;
}

export function parseHockeyStandenTeam(html:string):ExternalTeam|null{
  const $=cheerio.load(html),structured=jsonLd($).find(x=>x["@type"]==="SportsTeam");
  const heading=String(structured?.name??$("h1").first().text()).trim();
  if(!heading)return null;
  const member=structured?.memberOf as {name?:string}|undefined;
  const logo=$(".team-hero img, img[alt*='Rapide' i]").first().attr("src");
  return{name:heading,clubName:member?.name,logoUrl:logo?.startsWith("/")?`https://hockeystanden.nl${logo}`:logo};
}

function parseDate(value:string){
  const match=value.match(/(\d{1,2})[-/](\d{1,2})(?:[-/](\d{2,4}))?/);
  if(!match)return null;
  const year=match[3]?Number(match[3].length===2?`20${match[3]}`:match[3]):new Date().getFullYear();
  const date=new Date(Date.UTC(year,Number(match[2])-1,Number(match[1])));
  return Number.isNaN(date.getTime())?null:date;
}

export function parseHockeyStandenMatches(html:string):ExternalMatch[]{
  const $=cheerio.load(html),structured=jsonLd($).filter(x=>x["@type"]==="SportsEvent");
  if(structured.length)return structured.flatMap(x=>{
    const home=x.homeTeam as {name?:string;score?:number}|undefined,away=x.awayTeam as {name?:string;score?:number}|undefined,date=new Date(String(x.startDate??""));
    if(!home?.name||!away?.name||Number.isNaN(date.getTime()))return[];
    const id=String(x["@id"]??`${date.toISOString()}:${home.name}:${away.name}`).split("#event-").at(-1)!;
    const eventStatus=String(x.eventStatus??""),score=x.result as {homeScore?:number;awayScore?:number}|undefined;
    const homeScore=home.score??score?.homeScore,awayScore=away.score??score?.awayScore;
    const location=x.location as {name?:string}|undefined,league=x.superEvent as {name?:string}|undefined;
    return[{externalId:id,date,startTime:date.toLocaleTimeString("nl-NL",{hour:"2-digit",minute:"2-digit",hour12:false,timeZone:"Europe/Amsterdam"}),homeTeam:home.name,awayTeam:away.name,homeScore,awayScore,status:eventStatus.includes("Cancelled")?"cancelled":homeScore!=null?"finished":eventStatus.includes("Scheduled")?"scheduled":"unknown",venue:location?.name,competition:league?.name} satisfies ExternalMatch]
  });
  const result:ExternalMatch[]=[];
  $(".ml__item, table tr, .match, [data-match]").each((_,el)=>{
    const cells=$(el).find("td").map((__,x)=>$(x).text().trim()).get(),text=$(el).text().replace(/\s+/g," ").trim(),date=parseDate(cells[0]??text),score=text.match(/(\d+)\s*[-–]\s*(\d+)/);
    const home=$(el).find(".ml__home .ml__name, [data-home], .home-team").first().text().trim(),away=$(el).find(".ml__away .ml__name, [data-away], .away-team").first().text().trim();
    if(!date||!home||!away)return;
    const id=$(el).attr("data-match")||`${date.toISOString().slice(0,10)}:${home}:${away}`;
    result.push({externalId:id,date,startTime:text.match(/\b([01]?\d|2[0-3]):[0-5]\d\b/)?.[0],homeTeam:home,awayTeam:away,homeScore:score?number(score[1]):undefined,awayScore:score?number(score[2]):undefined,status:score?"finished":"scheduled"});
  });
  return unique(result,m=>m.externalId);
}

export function parseHockeyStandenStandings(html:string):ExternalStanding[]{
  const $=cheerio.load(html),result:ExternalStanding[]=[];
  $("table").each((_,table)=>{
    const header=$(table).find("tr").first().text().toLowerCase(),isStanding=$(table).find(".standings__row").length>0||((/gs|gespeeld|g/.test(header))&&(/pnt|punten|p/.test(header)));
    if(!isStanding)return;
    $(table).find("tr").slice(1).each((__,row)=>{
      const cells=$(row).find("td").map((___,x)=>$(x).text().trim().replace(/\s+/g," ")).get();
      if(cells.length<10)return;
      const team=$(row).find(".team-name").text().trim()||cells[1].replace(/^[A-Z0-9-]+\s+/,"");
      result.push({position:number(cells[0]),team,played:number(cells[2]),won:number(cells[3]),drawn:number(cells[4]),lost:number(cells[5]),goalsFor:number(cells[6]),goalsAgainst:number(cells[7]),goalDifference:number(cells[8].replace(/\s/g,"")),points:number(cells[9]),competition:$(table).closest("section,aside").find("h2,h3").first().text().trim()||"Competitie"});
    });
  });
  return result;
}

function unique<T>(items:T[],key:(x:T)=>string){return[...new Map(items.map(x=>[key(x),x])).values()]}
