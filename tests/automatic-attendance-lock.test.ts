import { describe, expect, it } from "vitest";
import { isAttendanceAutoLocked } from "@/lib/attendance-lock";

describe("automatische aanwezigheidsvergrendeling", () => {
  const nextDay = new Date("2026-09-06T10:00:00.000Z");

  it("vergrendelt vanaf de dag na de activiteit in de Amsterdamse tijdzone", () => {
    expect(isAttendanceAutoLocked(new Date("2026-09-04T22:30:00.000Z"), nextDay)).toBe(true);
    expect(isAttendanceAutoLocked(new Date("2026-09-05T22:30:00.000Z"), nextDay)).toBe(false);
  });
});
