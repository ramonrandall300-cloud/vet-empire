const LBS_PER_KG = 2.2046226218;

export function kgToLbs(kg: number) {
  return kg * LBS_PER_KG;
}

export function lbsToKg(lbs: number) {
  return lbs / LBS_PER_KG;
}

/** Format a stored kilogram value as pounds for display. */
export function formatLbs(raw: unknown): string {
  if (raw == null || raw === "") return "—";
  const kg = Number(raw);
  if (!Number.isFinite(kg)) return "—";
  return `${kgToLbs(kg).toFixed(1)} lbs`;
}

/** Stored kg → pounds string for form inputs. */
export function kgToLbsInput(raw: unknown): string {
  const kg = Number(raw);
  if (!Number.isFinite(kg)) return "";
  return String(Number(kgToLbs(kg).toFixed(2)));
}

/** Pounds form input → stored kg value. */
export function lbsInputToKg(value: string): number | null {
  const lbs = Number(value);
  if (!Number.isFinite(lbs)) return null;
  return Number(lbsToKg(lbs).toFixed(3));
}
