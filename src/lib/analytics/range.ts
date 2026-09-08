/**
 * Date-range presets.
 *
 * These resolve HERE, not in the API. The API takes literal `from`/`to` dates
 * on purpose, so "today" is answered once — against the business day — rather
 * than by a second clock on the server.
 *
 * Dates are handled as `YYYY-MM-DD` strings in UTC arithmetic. They are day
 * labels, not instants; parsing them in local time would shift them a day.
 */

export type RangePreset =
  | "today"
  | "yesterday"
  | "7d"
  | "30d"
  | "month"
  | "custom";

export const PRESET_LABELS: Record<RangePreset, string> = {
  today: "Today",
  yesterday: "Yesterday",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  month: "This month",
  custom: "Custom",
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;
/** Asia/Manila is a fixed UTC+8 — the Philippines has observed no DST since 1978. */
const MANILA_OFFSET_MS = 8 * 60 * 60 * 1000;

export function addDays(date: string, days: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * MS_PER_DAY)
    .toISOString()
    .slice(0, 10);
}

/** Today's date in Manila, which is what an owner means by "today". */
export function todayInManila(now: Date = new Date()): string {
  return new Date(now.getTime() + MANILA_OFFSET_MS).toISOString().slice(0, 10);
}

export function resolvePreset(
  preset: RangePreset,
  today: string,
): { from: string; to: string } {
  switch (preset) {
    case "yesterday": {
      const day = addDays(today, -1);
      return { from: day, to: day };
    }
    // Inclusive of today: "7 days" on the 15th is the 9th through the 15th.
    case "7d":
      return { from: addDays(today, -6), to: today };
    case "30d":
      return { from: addDays(today, -29), to: today };
    case "month":
      // To TODAY, not to month end — a report cannot cover days that have not
      // happened, and asking for them would just return zeros.
      return { from: `${today.slice(0, 7)}-01`, to: today };
    case "today":
    case "custom":
    default:
      return { from: today, to: today };
  }
}
