// Calendrier fixe 365 jours (déterminisme, Principe I) : conversion jour de l'année → date ISO.
const CUMUL_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function pad4(year: number): string {
  const sign = year < 0 ? '-' : '';
  return sign + String(Math.abs(year)).padStart(4, '0');
}

/** Extrait l'année (entier, éventuellement négatif) d'une date ISO YYYY-MM-DD. */
export function yearOfIso(dateIso: string): number {
  const m = /^(-?\d+)-/.exec(dateIso);
  return m ? Number(m[1]) : 0;
}

/** Convertit un jour de l'année [0..364] en date ISO YYYY-MM-DD (calendrier fixe 365 j). */
export function isoDate(year: number, dayOfYear: number): string {
  let d = dayOfYear;
  let month = 0;
  while (d >= CUMUL_DAYS[month]) {
    d -= CUMUL_DAYS[month];
    month++;
  }
  const mm = String(month + 1).padStart(2, '0');
  const dd = String(d + 1).padStart(2, '0');
  return `${pad4(year)}-${mm}-${dd}`;
}
