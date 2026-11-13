/** Helpers for the Parts List & BOM guide page. Source data: bom.json, which
 *  follows Purchasing_List_v3X_sa.xlsx in the v3X GitHub repository. */
import bom from './bom.json';

export type Part = (typeof bom)[number];

export const required = bom.filter(p => !p.optional);
export const optional = bom.filter(p => p.optional);

const sum = (rows: Part[]) => rows.reduce((s, p) => s + (p.total ?? 0), 0);
export const money = (n: number | null | undefined) =>
  n == null ? '–' : `$${n.toFixed(2)}`;

export const totals = {
  required: money(sum(required)),
  optional: money(sum(optional)),
  requiredCount: required.length,
  digikeyRequired: required.filter(p => p.digikey).length,
};

const qty = (p: Part) => parseInt(String(p.qty), 10) || 1;

/** Digi-Key Bulk Add text: one "quantity, part number" line per part. */
export function digikeyList(
  detectors: number,
  rows: readonly Part[] = required
) {
  return rows
    .filter(p => p.digikey)
    .map(p => `${qty(p) * detectors}, ${p.digikey!.partNumber}`)
    .join('\n');
}

/** Reference designators with a space after each comma, so long lists wrap. */
export const refs = (p: Part) =>
  p.refs ? p.refs.replace(/\s*,\s*/g, ', ') : '–';
