/**
 * Timestamps are stored UTC and displayed Asia/Manila — the same rule the POS terminal
 * follows. The timezone is pinned explicitly rather than left to the viewer's locale so a
 * Sentry operator abroad reads the same clock as the business they are looking at.
 */

const DATE_TIME = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Manila",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

const DATE_ONLY = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Manila",
  day: "numeric",
  month: "short",
  year: "numeric",
});

function format(iso: string, formatter: Intl.DateTimeFormat): string {
  const date = new Date(iso);
  // A bad timestamp should read as absent, not as the words "Invalid Date" in a table cell.
  if (Number.isNaN(date.getTime())) return "—";
  return formatter.format(date);
}

export function formatManilaDateTime(iso: string): string {
  return format(iso, DATE_TIME);
}

export function formatManilaDate(iso: string): string {
  return format(iso, DATE_ONLY);
}
