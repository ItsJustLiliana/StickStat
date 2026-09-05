const calendarDate = new Intl.DateTimeFormat("sv-SE", {timeZone: "Europe/Amsterdam"});

export function compareAgendaItems(a: {date: Date; time: string | null}, b: {date: Date; time: string | null}) {
  const day = calendarDate.format(a.date).localeCompare(calendarDate.format(b.date));
  if (day) return day;
  // An event without a start time follows the timed events of that day.
  return (a.time ?? "99:99").localeCompare(b.time ?? "99:99");
}
