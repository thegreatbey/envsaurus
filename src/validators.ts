// convert string to number
// why: config should be typed
// how: coerce, then guard against NaN
export function asNumber(x: string | undefined, key = ''): number {
  if (x == null || x === '') throw new Error(`${key} required`);
  const n = Number(x);
  if (Number.isNaN(n)) throw new Error(`${key} must be number`);
  return n;
}

// convert common truthy strings to boolean
export function asBoolean(x: string | undefined): boolean {
  if (x == null || x === '') return false;
  const v = x.toLowerCase();
  return v === '1' || v === 'true' || v === 'yes' || v === 'on';
}

// ensure value belongs to enum options
export function asEnum<T extends string>(
  x: string | undefined,
  key: string,
  opts: readonly T[]
): T {
  if (!x || !opts.includes(x as T))
    throw new Error(`${key} must be one of ${opts.join(',')}`);
  return x as T;
}

// validate as URL and normalize to string
export function asURL(x: string | undefined, key = ''): string {
  try {
    return new URL(String(x)).toString();
  } catch {
    throw new Error(`${key} must be a valid URL`);
  }
}

// basic email shape
export function asEmail(x: string | undefined, key = ''): string {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!x || !re.test(x)) throw new Error(`${key} must be a valid email`);
  return x;
}

// parse JSON safely
export function asJSON<T = unknown>(x: string | undefined, key = ''): T {
  try {
    return JSON.parse(String(x)) as T;
  } catch {
    throw new Error(`${key} must be valid JSON`);
  }
}
