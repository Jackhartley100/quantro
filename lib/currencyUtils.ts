/**
 * Maps currency symbols to ISO 4217 currency codes
 */
export function getCurrencyCodeFromSymbol(symbol: string): string {
  const symbolToCode: Record<string, string> = {
    "£": "GBP",
    "$": "USD",
    "€": "EUR",
    "¥": "JPY",
    "₹": "INR",
    "A$": "AUD",
    "C$": "CAD",
    "CHF": "CHF",
    "NZ$": "NZD",
    "R": "ZAR",
    "kr": "SEK",
    "R$": "BRL",
    "₽": "RUB",
    "₩": "KRW",
    "₪": "ILS",
    "₦": "NGN",
    "₨": "PKR",
    "₫": "VND",
    "₱": "PHP",
    "₨": "LKR",
    "₴": "UAH",
  };
  
  return symbolToCode[symbol] || "GBP"; // Default to GBP if not found
}

/**
 * Formats a number as currency using Intl.NumberFormat
 */
export function formatCurrency(
  amount: number,
  currencySymbol: string,
  options?: { maximumFractionDigits?: number; minimumFractionDigits?: number }
): string {
  const currencyCode = getCurrencyCodeFromSymbol(currencySymbol);
  const formatter = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: options?.maximumFractionDigits ?? 0,
    minimumFractionDigits: options?.minimumFractionDigits ?? 0,
  });
  
  return formatter.format(amount);
}

