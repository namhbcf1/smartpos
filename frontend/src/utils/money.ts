export function toCents(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value);
}

export function fromCents(cents: number): number {
  if (!Number.isFinite(cents)) return 0;
  return cents / 100;
}

export function addCents(a: number, b: number): number {
  return toCents(a + b);
}

export function subCents(a: number, b: number): number {
  return toCents(a - b);
}

export function mulCents(cents: number, factor: number): number {
  return toCents(cents * factor);
}

export function formatVND(cents: number): string {
  const value = Number.isFinite(cents) ? cents : 0;
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
}

export function calculateTotals(items: Array<{ quantity: number; unit_price_cents: number; discount_cents?: number; tax_rate?: number }>, taxRateDefault = 0): {
  subtotal_cents: number;
  discount_cents: number;
  tax_cents: number;
  total_cents: number;
} {
  let subtotal = 0;
  let discount = 0;

  for (const it of items) {
    const line = toCents((it.unit_price_cents || 0) * (it.quantity || 0));
    subtotal = addCents(subtotal, line);
    if (it.discount_cents) discount = addCents(discount, toCents(it.discount_cents));
  }

  const taxable = Math.max(0, subCents(subtotal, discount));
  const effectiveTaxRate = taxRateDefault;
  const tax = mulCents(taxable, effectiveTaxRate);
  const total = addCents(taxable, tax);

  return {
    subtotal_cents: subtotal,
    discount_cents: discount,
    tax_cents: tax,
    total_cents: total,
  };
}

