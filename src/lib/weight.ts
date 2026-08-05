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

/** Format a stored celsius value as fahrenheit for display. */
export function formatFahrenheit(raw: unknown): string {
  if (raw == null || raw === "") return "—";
  const c = Number(raw);
  if (!Number.isFinite(c)) return "—";
  return `${(c * 9) / 5 + 32}°F`.replace(/(\.\d)\d+/, "$1");
}

/** Stored celsius → fahrenheit string for form inputs. */
export function celsiusToFahrenheitInput(raw: unknown): string {
  const c = Number(raw);
  if (!Number.isFinite(c)) return "";
  return String(Number((((c * 9) / 5 + 32)).toFixed(1)));
}

/** Fahrenheit form input → stored celsius value. */
export function fahrenheitInputToCelsius(value: string): number | null {
  const f = Number(value);
  if (!Number.isFinite(f)) return null;
  return Number((((f - 32) * 5) / 9).toFixed(2));
}
