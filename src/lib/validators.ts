// cspell:disable
/**
 * Shared form validation utilities
 * Import and use across management pages.
 */

// ─── Single-field validators ────────────────────────────────────────────────

/** Value is non-empty and not only whitespace */
export function required(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "Trường này là bắt buộc.";
  if (typeof value === "number") return "";
  if (value.trim() === "") return "Trường này là bắt buộc.";
  return "";
}

/** Vietnamese phone: 10 digits, starts with 0 */
export function phone(value: string): string {
  if (!value) return ""; // optional – skip if empty
  const trimmed = value.trim();
  if (!/^0\d{9}$/.test(trimmed))
    return "Số điện thoại phải có 10 chữ số và bắt đầu bằng 0.";
  return "";
}

/** CCCD: exactly 12 digits */
export function cccd(value: string): string {
  if (!value) return ""; // optional – skip if empty
  const trimmed = value.trim();
  if (!/^\d{12}$/.test(trimmed)) return "CCCD phải đúng 12 chữ số.";
  return "";
}

/** Standard email format */
export function email(value: string): string {
  if (!value) return ""; // optional – skip if empty
  const trimmed = value.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed))
    return "Địa chỉ email không hợp lệ.";
  return "";
}

/**
 * No special characters (allow: letters incl. Vietnamese, digits, space, dot,
 * comma, dash, underscore, parentheses, slash).
 */
export function noSpecialChars(value: string): string {
  if (!value) return "";
  // Allow anything that is NOT a "special" symbol
  if (/[!@#$%^&*+=[\]{};'"\\|<>?~`]/.test(value))
    return "Không được chứa ký tự đặc biệt.";
  return "";
}

/** Number must be ≥ 0 */
export function positiveNumber(value: number): string {
  if (value < 0) return "Giá trị không được nhỏ hơn 0.";
  return "";
}

// ─── Batch runner ───────────────────────────────────────────────────────────

type Rules = Record<string, string>;

/**
 * Run a map of { fieldKey: errorMessage } and return only the non-empty ones.
 * Usage:
 *   const errors = collectErrors({
 *     name: required(name) || noSpecialChars(name),
 *     phone: phone(phoneVal),
 *   });
 *   const isValid = Object.keys(errors).length === 0;
 */
export function collectErrors(rules: Rules): Rules {
  const result: Rules = {};
  for (const [key, message] of Object.entries(rules)) {
    if (message) result[key] = message;
  }
  return result;
}

// ─── Helper ─────────────────────────────────────────────────────────────────

/** Returns Tailwind border class for an input based on whether it has an error */
export function inputErrorClass(error?: string): string {
  return error ? "border-destructive focus-visible:ring-destructive" : "";
}
