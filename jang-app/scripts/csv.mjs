// Minimal RFC 4180 CSV parser (quoted fields, escaped quotes, CRLF, newlines inside quotes).
// Returns an array of objects keyed by the header row.

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  const src = text.replace(/^﻿/, '');

  for (let i = 0; i < src.length; i += 1) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i += 1;
      row.push(field);
      field = '';
      rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  const [header, ...body] = rows.filter((r) => r.some((cell) => cell.trim() !== ''));
  if (!header) return [];
  return body.map((cells) => Object.fromEntries(header.map((name, idx) => [name.trim(), cells[idx] ?? ''])));
}

// Columns that may reach the client. Everything else in the CSV is private.
export const PUBLIC_COLUMNS = ['ID', 'Matiere', 'Chapitre', 'Enonce', 'Donnees', 'Statut_validation'];

// Columns that hold answers: they must never appear in src/ or dist/.
export const PRIVATE_COLUMNS = [
  'Corrige_reference',
  'Resultat_final',
  'Erreur_frequente',
  'Exercice_similaire',
  'Reponse_similaire',
];
