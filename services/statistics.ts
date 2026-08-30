export type ResultInput = { homeTeamId: string; awayTeamId: string; homeScore: number | null; awayScore: number | null; date: Date };
export class StatisticsService {
  static resultFor(match: ResultInput, teamId: string) {
    if (match.homeScore == null || match.awayScore == null) return null;
    const home = match.homeTeamId === teamId; const goalsFor = home ? match.homeScore : match.awayScore; const goalsAgainst = home ? match.awayScore : match.homeScore;
    return { goalsFor, goalsAgainst, outcome: goalsFor > goalsAgainst ? "W" : goalsFor < goalsAgainst ? "V" : "G", points: goalsFor > goalsAgainst ? 3 : goalsFor === goalsAgainst ? 1 : 0, home } as const;
  }
  static summary(matches: ResultInput[], teamId: string) {
    const results = matches.map((m) => ({ match: m, result: StatisticsService.resultFor(m, teamId) })).filter((x): x is { match: ResultInput; result: NonNullable<ReturnType<typeof StatisticsService.resultFor>> } => Boolean(x.result));
    return results.reduce((s, x) => ({ ...s, played: s.played + 1, won: s.won + +(x.result.outcome === "W"), drawn: s.drawn + +(x.result.outcome === "G"), lost: s.lost + +(x.result.outcome === "V"), goalsFor: s.goalsFor + x.result.goalsFor, goalsAgainst: s.goalsAgainst + x.result.goalsAgainst, points: s.points + x.result.points }), { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0 });
  }
  static form(matches: ResultInput[], teamId: string, count = 5) { return [...matches].sort((a,b) => b.date.getTime()-a.date.getTime()).map((m) => StatisticsService.resultFor(m, teamId)?.outcome).filter(Boolean).slice(0,count); }
  static cumulativePoints(matches: ResultInput[], teamId: string) { let total=0; return [...matches].sort((a,b)=>a.date.getTime()-b.date.getTime()).map((m)=>({ date:m.date.toISOString().slice(0,10), points: total += StatisticsService.resultFor(m,teamId)?.points ?? 0 })); }
}
