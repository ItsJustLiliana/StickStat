const localDate = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Amsterdam" });

export function isAttendanceAutoLocked(eventDate: Date, now = new Date()) {
  return localDate.format(eventDate) < localDate.format(now);
}
