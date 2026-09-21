/**
 * Port of `ISO8601Parsing.swift`.
 *
 * The upstream feeds disagree about the seconds component:
 *   - MLB Stats API / NBA CDN -> "2026-08-02T00:40:00Z"  (seconds present)
 *   - ESPN NFL API            -> "2026-09-11T00:35Z"     (seconds omitted)
 *
 * `Date.parse` handles both shapes in current engines, but the minute-precision
 * form is a documented grey area, so fall back to an explicit pattern rather
 * than silently dropping every NFL game the way the original bug did.
 */
const MINUTE_PRECISION =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?:Z|([+-])(\d{2}):?(\d{2}))?$/;

export function parseISO8601(value: string | null | undefined): Date | null {
  if (!value) return null;

  const native = new Date(value);
  if (!Number.isNaN(native.getTime())) return native;

  const match = MINUTE_PRECISION.exec(value.trim());
  if (!match) return null;

  const [, year, month, day, hour, minute, sign, offsetHour, offsetMinute] = match;
  let timestamp = Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
  );

  if (sign && offsetHour && offsetMinute) {
    const offsetMinutes = Number(offsetHour) * 60 + Number(offsetMinute);
    timestamp += (sign === '+' ? -1 : 1) * offsetMinutes * 60_000;
  }

  return new Date(timestamp);
}
