export type PlayerRankingRow = {
  id: string;
  matches: number;
  starts: number;
  goals: number;
  assists: number;
  saves: number;
  mvps: number;
  cards: number;
  matchAttendance: number;
  trainingAttendance: number;
};

const categories: {label: string; value: (row: PlayerRankingRow) => number}[] = [
  {label: "Wedstrijden", value: row => row.matches},
  {label: "Basisplaatsen", value: row => row.starts},
  {label: "Topscorers", value: row => row.goals},
  {label: "Assists", value: row => row.assists},
  {label: "G + A", value: row => row.goals + row.assists},
  {label: "Reddingen", value: row => row.saves},
  {label: "MVP's", value: row => row.mvps},
  {label: "Kaarten", value: row => row.cards},
  {label: "Wedstrijd aanwezig", value: row => row.matchAttendance},
  {label: "Training aanwezig", value: row => row.trainingAttendance},
];

export function playerRankingPositions(players: PlayerRankingRow[], playerId: string) {
  const own = players.find(player => player.id === playerId);
  return categories.map(({label, value}) => {
    const score = own ? value(own) : 0;
    return {label, rank: score > 0 ? 1 + players.filter(player => value(player) > score).length : null};
  });
}
