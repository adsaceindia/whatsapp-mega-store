export const getCurrencySymbol = (code?: string): string => {
  if (!code) return '$';
  const upper = code.trim().toUpperCase();
  switch (upper) {
    case 'INR': return '₹';
    case 'EUR': return '€';
    case 'GBP': return '£';
    case 'USD': return '$';
    case 'CAD': return 'C$';
    case 'AUD': return 'A$';
    case 'NZD': return 'NZ$';
    case 'JPY':
    case 'CNY': return '¥';
    case 'RUB': return '₽';
    case 'KRW': return '₩';
    case 'TRY': return '₺';
    case 'THB': return '฿';
    case 'VND': return '₫';
    case 'SGD': return 'S$';
    case 'ILS': return '₪';
    case 'ZAR': return 'R';
    case 'PHP': return '₱';
    case 'IDR': return 'Rp';
    case 'MYR': return 'RM';
    case 'CHF': return 'CHF';
    case 'SEK':
    case 'NOK':
    case 'DKK': return 'kr';
    case 'AED': return 'AED';
    case 'SAR': return 'SAR';
    case 'BRL': return 'R$';
    case 'PKR': return 'Rs';
    case 'PLN': return 'zł';
    case 'HUF': return 'Ft';
    case 'CZK': return 'Kč';
    case 'MXN': return 'Mex$';
    default:
      // If code is not matching, return code or $
      return upper.length <= 4 ? upper + ' ' : '$';
  }
};

export const formatPrice = (price: number, code?: string): string => {
  const symbol = getCurrencySymbol(code);
  const formatted = (price || 0).toFixed(2);
  if (symbol.match(/^[A-Za-z]+$/)) {
    return `${symbol} ${formatted}`;
  }
  return `${symbol}${formatted}`;
};
