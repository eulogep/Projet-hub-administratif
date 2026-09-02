import type { CrousLog } from "../schemas/crous-hours.schema";

const parisParts = (instant: string) => Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(instant)).filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
export function parisLocalToIso(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return value;
  const [, year, month, day, hour, minute] = match;
  const guess = Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
  const offsetName = new Intl.DateTimeFormat("en", { timeZone: "Europe/Paris", timeZoneName: "longOffset" }).formatToParts(new Date(guess)).find((part) => part.type === "timeZoneName")?.value ?? "GMT+00:00";
  const offset = /GMT([+-])(\d{2}):(\d{2})/.exec(offsetName);
  if (!offset) return value;
  const offsetMinutes = (Number(offset[2]) * 60 + Number(offset[3])) * (offset[1] === "+" ? 1 : -1);
  const instant = new Date(guess - offsetMinutes * 60000);
  const rendered = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(instant).filter((part) => part.type !== "literal");
  const parts = Object.fromEntries(rendered.map((part) => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}` === value ? instant.toISOString() : value;
}
export function parisDateKey(instant: string) { const p = parisParts(instant); return `${p.year}-${p.month}-${p.day}`; }
export function monthKey(instant: string) { return parisDateKey(instant).slice(0, 7); }
export function isoWeekKey(instant: string) { const [year, month, day] = parisDateKey(instant).split("-").map(Number); const date = new Date(Date.UTC(year, month - 1, day)); const weekday = date.getUTCDay() || 7; date.setUTCDate(date.getUTCDate() + 4 - weekday); const isoYear = date.getUTCFullYear(); const first = new Date(Date.UTC(isoYear, 0, 1)); const week = Math.ceil((((date.getTime() - first.getTime()) / 86400000) + 1) / 7); return `${isoYear}-W${String(week).padStart(2, "0")}`; }
export function overlaps(a: { starts_at: string; ends_at: string }, b: { starts_at: string; ends_at: string }) { return new Date(a.starts_at) < new Date(b.ends_at) && new Date(a.ends_at) > new Date(b.starts_at); }
export function formatMinutes(minutes: number) { const sign = minutes < 0 ? "−" : ""; const absolute = Math.abs(minutes); return `${sign}${Math.floor(absolute / 60)} h ${String(absolute % 60).padStart(2, "0")}`; }
export function summarizeHours(logs: CrousLog[], targetMinutes: number) { const realized = logs.filter((log) => !log.archived_at).reduce((sum, log) => sum + log.credited_minutes, 0); return { realized, remaining: Math.max(targetMinutes - realized, 0), overrun: Math.max(realized - targetMinutes, 0) }; }
export function groupTotals(logs: CrousLog[], key: (instant: string) => string) { return logs.filter((log) => !log.archived_at).reduce<Record<string, number>>((groups, log) => { const group = key(log.starts_at); groups[group] = (groups[group] ?? 0) + log.credited_minutes; return groups; }, {}); }
