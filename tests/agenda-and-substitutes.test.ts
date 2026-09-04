import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const schema = readFileSync("prisma/schema.prisma", "utf8");
const migration = readFileSync("prisma/migrations/20260904170000_substitute_players/migration.sql", "utf8");
const attendance = readFileSync("components/attendance-list.tsx", "utf8");
const players = readFileSync("app/players/page.tsx", "utf8");
const agenda = readFileSync("app/agenda/page.tsx", "utf8");
const trainingForm = readFileSync("components/training-create-form.tsx", "utf8");
const picker = readFileSync("components/date-time-picker.tsx", "utf8");

describe("invalspelers en agendaweergave", () => {
  it("slaat invalspelers expliciet op en toont ze in een aparte lijst", () => {
    expect(schema).toContain("isSubstitute Boolean @default(false)");
    expect(migration).toContain('ADD COLUMN "isSubstitute" BOOLEAN NOT NULL DEFAULT false');
    expect(players).toContain("<h2>Invalspelers</h2>");
    expect(attendance).toContain('<details className="substitute-attendance">');
    expect(attendance).toContain("rows.filter(person=>person.isSubstitute)");
  });

  it("houdt afspraken tot na hun kalenderdag in Teamagenda", () => {
    expect(agenda).toContain('dateKey(item.date) < today');
    expect(agenda).toContain('dateKey(item.date) >= today');
    expect(agenda).toContain('>Teamagenda</Link>');
    expect(agenda).toContain('>Verlopen</Link>');
    expect(agenda).toContain("agenda-week-separator");
  });

  it("gebruikt eigen datum- en tijdpopovers", () => {
    expect(trainingForm).toContain("<StyledDatePicker");
    expect(trainingForm).toContain("<StyledTimePicker");
    expect(trainingForm).not.toContain('type="date"');
    expect(trainingForm).not.toContain('type="time"');
    expect(picker).toContain('role="dialog"');
    expect(picker).toContain('className="time-hours"');
  });
});
