import {describe, expect, it} from "vitest";
import {compareAgendaItems} from "../lib/agenda-order";

describe("agenda chronologie", () => {
  it("mengt trainingen en wedstrijden op starttijd, onafhankelijk van de tijd in de datumkolom", () => {
    const items = [
      {date: new Date("2026-09-05T00:00:00Z"), time: "20:00"},
      {date: new Date("2026-09-05T12:00:00Z"), time: "09:00"},
      {date: new Date("2026-09-05T00:00:00Z"), time: null},
    ];
    expect(items.sort(compareAgendaItems).map(item => item.time)).toEqual(["09:00", "20:00", null]);
  });
  it("sorteert eerst op Nederlandse kalenderdag", () => {
    const a = {date: new Date("2026-09-05T22:30:00Z"), time: "08:00"};
    const b = {date: new Date("2026-09-05T00:00:00Z"), time: "20:00"};
    expect(compareAgendaItems(a, b)).toBeGreaterThan(0);
  });
});
