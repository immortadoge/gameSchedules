/** Local-timezone date helpers, replacing the iOS `Calendar.current` usage. */

export function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function addMonths(date: Date, months: number): Date {
  const copy = new Date(date);
  copy.setMonth(copy.getMonth() + months);
  return copy;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isWithin(date: Date, start: Date, end: Date): boolean {
  const time = date.getTime();
  return time >= start.getTime() && time <= end.getTime();
}

/** "yyyy-MM-dd" in local time, for the MLB schedule query. */
export function toYYYYMMDD(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: 'numeric',
  minute: '2-digit',
});

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});

const dayHeaderFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: 'long',
  month: 'short',
  day: 'numeric',
});

/** "7:30 PM" — the iOS `h:mm a` formatter. */
export function formatTime(date: Date): string {
  return timeFormatter.format(date);
}

export function formatDate(date: Date): string {
  return dateFormatter.format(date);
}

/** "Monday, Sep 21" — the iOS `todayHeader`. */
export function formatDayHeader(date: Date): string {
  return dayHeaderFormatter.format(date);
}

/** ISO string suitable for a `<time datetime>` attribute. */
export function toDateTimeAttribute(date: Date): string {
  return date.toISOString();
}
