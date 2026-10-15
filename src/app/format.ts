/**
 * Helpers de formatage présentationnel (i18n fr) — dates/nombres/pourcentages passent par les pipes
 * Angular (`date`/`number`/`percent`, locale fr enregistrée dans main.ts). Ici : les cas que les pipes
 * ne couvrent pas (cron lisible, montant d'un paramètre typé). Aucune valeur métier en dur (§1.6).
 */

const FR_NUMBER = new Intl.NumberFormat('fr-FR');

/** Formate une valeur de paramètre de contrôle selon son type (MONEY → montant, NUMBER → nombre groupé). */
export function formatParameterValue(value: unknown, type?: string): string {
  if (value === null || value === undefined || value === '') {
    return '—';
  }
  if (Array.isArray(value)) {
    return value.map((v) => formatParameterValue(v, type)).join(', ');
  }
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isNaN(num) && (type === 'MONEY' || type === 'NUMBER')) {
    return type === 'MONEY' ? `${FR_NUMBER.format(num)} MAD` : FR_NUMBER.format(num);
  }
  return String(value);
}

/**
 * Rend une expression cron (Spring, 6 champs : sec min heure jour mois jour-semaine) lisible en français
 * pour les cas courants ; sinon renvoie l'expression telle quelle entre parenthèses.
 */
export function humanizeCron(cron?: string): string {
  if (!cron) {
    return '—';
  }
  const parts = cron.trim().split(/\s+/);
  if (parts.length === 6) {
    const [sec, min, hour, dom, mon, dow] = parts;
    const time = /^\d+$/.test(hour) && /^\d+$/.test(min) && (sec === '0' || sec === '*')
      ? `${hour.padStart(2, '0')}:${min.padStart(2, '0')}`
      : null;
    if (time && dom === '*' && mon === '*' && dow === '*') {
      return `tous les jours à ${time}`;
    }
    if (time && dow !== '*' && dom === '*') {
      return `chaque semaine à ${time}`;
    }
    if (time) {
      return `à ${time}`;
    }
  }
  return `planification : ${cron}`;
}
