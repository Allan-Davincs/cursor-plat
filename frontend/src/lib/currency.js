const CURRENCY = 'TZS';

export function formatPrice(amount) {
  return `${Number(amount).toLocaleString()} ${CURRENCY}`;
}

export function formatPriceShort(amount) {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M ${CURRENCY}`;
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(0)}K ${CURRENCY}`;
  }
  return `${amount} ${CURRENCY}`;
}

export { CURRENCY };
