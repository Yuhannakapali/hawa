const NEPAL_UTC_OFFSET_MS = (5 * 60 + 45) * 60 * 1000;
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function nepalShifted(date: Date): Date {
  return new Date(date.getTime() + NEPAL_UTC_OFFSET_MS);
}

export function nepalClock(iso: string): string {
  const d = nepalShifted(new Date(iso));
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

export function dateLabel(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  return `${WEEKDAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

export function nepalToday(now: Date): string {
  return nepalShifted(now).toISOString().slice(0, 10);
}

export function dayTabLabel(index: number, isoDate: string): string {
  if (index === 0) {
    return 'Today';
  }
  if (index === 1) {
    return 'Tomorrow';
  }
  return dateLabel(isoDate);
}
