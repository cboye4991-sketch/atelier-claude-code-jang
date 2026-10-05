const FORMATTER = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

/** "lundi 5 octobre": today's date for the header, in French. */
export function formatToday(date: Date = new Date()): string {
  return FORMATTER.format(date);
}
