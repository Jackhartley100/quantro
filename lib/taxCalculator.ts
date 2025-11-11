export type BusinessType = 
  | "sole-trader"
  | "llc"
  | "corporation"
  | "partnership"
  | "self-employed";

export type TaxLocation = 
  | "US"
  | "UK"
  | "CA"
  | "AU"
  | "NZ"
  | "IE"
  | "DE"
  | "FR"
  | "ES"
  | "IT"
  | "NL"
  | "BE"
  | "AT"
  | "CH"
  | "SE"
  | "NO"
  | "DK"
  | "FI"
  | "PL"
  | "CZ"
  | "PT"
  | "GR"
  | "RO"
  | "HU"
  | "SK"
  | "SI"
  | "EE"
  | "LV"
  | "LT"
  | "LU"
  | "MT"
  | "CY"
  | "custom";

export type TaxSettings = {
  location: TaxLocation;
  businessType: BusinessType;
  customRate?: number; // For custom location
  includeSelfEmployment?: boolean; // For US self-employment tax
};

// Tax brackets and rates by location
const TAX_RATES: Record<TaxLocation, { brackets: Array<{ min: number; max?: number; rate: number }>; selfEmployment?: number }> = {
  US: {
    brackets: [
      { min: 0, max: 10275, rate: 0.10 },
      { min: 10275, max: 41775, rate: 0.12 },
      { min: 41775, max: 89450, rate: 0.22 },
      { min: 89450, max: 190750, rate: 0.24 },
      { min: 190750, max: 364200, rate: 0.32 },
      { min: 364200, max: 462500, rate: 0.35 },
      { min: 462500, rate: 0.37 },
    ],
    selfEmployment: 0.1413, // 14.13% for self-employment tax (Social Security + Medicare)
  },
  UK: {
    brackets: [
      { min: 0, max: 12570, rate: 0.0 }, // Personal allowance
      { min: 12570, max: 50270, rate: 0.20 }, // Basic rate
      { min: 50270, max: 125140, rate: 0.40 }, // Higher rate
      { min: 125140, rate: 0.45 }, // Additional rate
    ],
  },
  CA: {
    brackets: [
      { min: 0, max: 53359, rate: 0.15 },
      { min: 53359, max: 106717, rate: 0.205 },
      { min: 106717, max: 165430, rate: 0.26 },
      { min: 165430, max: 235675, rate: 0.29 },
      { min: 235675, rate: 0.33 },
    ],
  },
  AU: {
    brackets: [
      { min: 0, max: 18200, rate: 0.0 },
      { min: 18200, max: 45000, rate: 0.19 },
      { min: 45000, max: 120000, rate: 0.325 },
      { min: 120000, max: 180000, rate: 0.37 },
      { min: 180000, rate: 0.45 },
    ],
  },
  NZ: {
    brackets: [
      { min: 0, max: 14000, rate: 0.105 },
      { min: 14000, max: 48000, rate: 0.175 },
      { min: 48000, max: 70000, rate: 0.30 },
      { min: 70000, max: 180000, rate: 0.33 },
      { min: 180000, rate: 0.39 },
    ],
  },
  IE: {
    brackets: [
      { min: 0, max: 40000, rate: 0.20 },
      { min: 40000, rate: 0.40 },
    ],
  },
  DE: {
    brackets: [
      { min: 0, max: 10347, rate: 0.0 },
      { min: 10347, max: 14926, rate: 0.14 },
      { min: 14926, max: 58596, rate: 0.42 },
      { min: 58596, rate: 0.45 },
    ],
  },
  FR: {
    brackets: [
      { min: 0, max: 10225, rate: 0.0 },
      { min: 10225, max: 26070, rate: 0.11 },
      { min: 26070, max: 74545, rate: 0.30 },
      { min: 74545, max: 160336, rate: 0.41 },
      { min: 160336, rate: 0.45 },
    ],
  },
  ES: {
    brackets: [
      { min: 0, max: 12450, rate: 0.19 },
      { min: 12450, max: 20200, rate: 0.24 },
      { min: 20200, max: 35200, rate: 0.30 },
      { min: 35200, max: 60000, rate: 0.37 },
      { min: 60000, max: 300000, rate: 0.45 },
      { min: 300000, rate: 0.47 },
    ],
  },
  IT: {
    brackets: [
      { min: 0, max: 15000, rate: 0.23 },
      { min: 15000, max: 28000, rate: 0.25 },
      { min: 28000, max: 50000, rate: 0.35 },
      { min: 50000, rate: 0.43 },
    ],
  },
  NL: {
    brackets: [
      { min: 0, max: 73031, rate: 0.3693 },
      { min: 73031, rate: 0.4950 },
    ],
  },
  BE: {
    brackets: [
      { min: 0, max: 13870, rate: 0.25 },
      { min: 13870, max: 24480, rate: 0.40 },
      { min: 24480, max: 42370, rate: 0.45 },
      { min: 42370, rate: 0.50 },
    ],
  },
  AT: {
    brackets: [
      { min: 0, max: 11000, rate: 0.0 },
      { min: 11000, max: 18000, rate: 0.20 },
      { min: 18000, max: 31000, rate: 0.35 },
      { min: 31000, max: 60000, rate: 0.42 },
      { min: 60000, max: 90000, rate: 0.48 },
      { min: 90000, rate: 0.50 },
    ],
  },
  CH: {
    brackets: [
      { min: 0, max: 14800, rate: 0.0 },
      { min: 14800, max: 31600, rate: 0.77 },
      { min: 31600, max: 41400, rate: 0.88 },
      { min: 41400, max: 55200, rate: 0.99 },
      { min: 55200, max: 72500, rate: 1.10 },
      { min: 72500, max: 78100, rate: 1.21 },
      { min: 78100, max: 103600, rate: 1.32 },
      { min: 103600, max: 134600, rate: 1.43 },
      { min: 134600, max: 176000, rate: 1.54 },
      { min: 176000, max: 755200, rate: 1.65 },
      { min: 755200, rate: 1.77 },
    ],
  },
  SE: {
    brackets: [
      { min: 0, max: 51900, rate: 0.0 },
      { min: 51900, rate: 0.20 },
    ],
  },
  NO: {
    brackets: [
      { min: 0, max: 198850, rate: 0.22 },
      { min: 198850, rate: 0.238 },
    ],
  },
  DK: {
    brackets: [
      { min: 0, rate: 0.37 }, // Simplified - Denmark has complex local taxes
    ],
  },
  FI: {
    brackets: [
      { min: 0, max: 19800, rate: 0.0 },
      { min: 19800, max: 29700, rate: 0.06 },
      { min: 29700, max: 49000, rate: 0.17 },
      { min: 49000, max: 85700, rate: 0.21 },
      { min: 85700, rate: 0.31 },
    ],
  },
  PL: {
    brackets: [
      { min: 0, max: 120000, rate: 0.12 },
      { min: 120000, rate: 0.32 },
    ],
  },
  CZ: {
    brackets: [
      { min: 0, rate: 0.15 },
    ],
  },
  PT: {
    brackets: [
      { min: 0, max: 7116, rate: 0.145 },
      { min: 7116, max: 10735, rate: 0.21 },
      { min: 10735, max: 20322, rate: 0.265 },
      { min: 20322, max: 25075, rate: 0.285 },
      { min: 25075, max: 36857, rate: 0.35 },
      { min: 36857, max: 80882, rate: 0.37 },
      { min: 80882, rate: 0.45 },
    ],
  },
  GR: {
    brackets: [
      { min: 0, max: 10000, rate: 0.09 },
      { min: 10000, max: 20000, rate: 0.22 },
      { min: 20000, max: 30000, rate: 0.28 },
      { min: 30000, max: 40000, rate: 0.36 },
      { min: 40000, max: 65000, rate: 0.44 },
      { min: 65000, rate: 0.44 },
    ],
  },
  RO: {
    brackets: [
      { min: 0, rate: 0.10 },
    ],
  },
  HU: {
    brackets: [
      { min: 0, rate: 0.15 },
    ],
  },
  SK: {
    brackets: [
      { min: 0, rate: 0.19 },
    ],
  },
  SI: {
    brackets: [
      { min: 0, max: 8847, rate: 0.16 },
      { min: 8847, max: 25459, rate: 0.26 },
      { min: 25459, max: 50918, rate: 0.33 },
      { min: 50918, max: 72697, rate: 0.39 },
      { min: 72697, rate: 0.50 },
    ],
  },
  EE: {
    brackets: [
      { min: 0, rate: 0.20 },
    ],
  },
  LV: {
    brackets: [
      { min: 0, rate: 0.20 },
    ],
  },
  LT: {
    brackets: [
      { min: 0, rate: 0.20 },
    ],
  },
  LU: {
    brackets: [
      { min: 0, max: 11294, rate: 0.0 },
      { min: 11294, max: 19999, rate: 0.08 },
      { min: 19999, max: 36792, rate: 0.10 },
      { min: 36792, max: 60002, rate: 0.12 },
      { min: 60002, max: 60002, rate: 0.14 },
      { min: 60002, max: 80004, rate: 0.16 },
      { min: 80004, max: 99996, rate: 0.18 },
      { min: 99996, rate: 0.42 },
    ],
  },
  MT: {
    brackets: [
      { min: 0, max: 9100, rate: 0.0 },
      { min: 9100, max: 14500, rate: 0.15 },
      { min: 14500, max: 19500, rate: 0.25 },
      { min: 19500, max: 60000, rate: 0.25 },
      { min: 60000, max: 80000, rate: 0.25 },
      { min: 80000, rate: 0.35 },
    ],
  },
  CY: {
    brackets: [
      { min: 0, max: 19500, rate: 0.0 },
      { min: 19500, max: 28000, rate: 0.20 },
      { min: 28000, max: 36300, rate: 0.25 },
      { min: 36300, max: 60000, rate: 0.30 },
      { min: 60000, rate: 0.35 },
    ],
  },
  custom: {
    brackets: [],
  },
};

export function calculateTax(
  taxableIncome: number,
  settings: TaxSettings
): number {
  if (taxableIncome <= 0) {
    return 0;
  }

  if (settings.location === "custom" && settings.customRate) {
    return taxableIncome * (settings.customRate / 100);
  }

  const taxConfig = TAX_RATES[settings.location];
  if (!taxConfig || taxConfig.brackets.length === 0) {
    return 0;
  }

  let tax = 0;

  // Calculate progressive tax
  for (const bracket of taxConfig.brackets) {
    const bracketMin = bracket.min;
    const bracketMax = bracket.max ?? Infinity;

    // Only calculate tax for this bracket if income exceeds the minimum
    if (taxableIncome > bracketMin) {
      // Calculate how much income falls in this bracket
      const incomeInThisBracket = Math.min(taxableIncome, bracketMax) - bracketMin;
      
      if (incomeInThisBracket > 0) {
        tax += incomeInThisBracket * bracket.rate;
      }
    }
  }

  // Add self-employment tax for US if applicable
  if (
    settings.location === "US" &&
    settings.includeSelfEmployment &&
    taxConfig.selfEmployment &&
    (settings.businessType === "self-employed" ||
      settings.businessType === "sole-trader")
  ) {
    // Self-employment tax applies to net earnings (after deductions)
    // For simplicity, we'll apply it to taxable income
    // In reality, it's more complex with Social Security wage base limits
    const selfEmploymentTax = taxableIncome * taxConfig.selfEmployment;
    tax += selfEmploymentTax;
  }

  return Math.max(0, tax);
}

export function getLocationName(location: TaxLocation): string {
  const names: Record<TaxLocation, string> = {
    US: "United States",
    UK: "United Kingdom",
    CA: "Canada",
    AU: "Australia",
    NZ: "New Zealand",
    IE: "Ireland",
    DE: "Germany",
    FR: "France",
    ES: "Spain",
    IT: "Italy",
    NL: "Netherlands",
    BE: "Belgium",
    AT: "Austria",
    CH: "Switzerland",
    SE: "Sweden",
    NO: "Norway",
    DK: "Denmark",
    FI: "Finland",
    PL: "Poland",
    CZ: "Czech Republic",
    PT: "Portugal",
    GR: "Greece",
    RO: "Romania",
    HU: "Hungary",
    SK: "Slovakia",
    SI: "Slovenia",
    EE: "Estonia",
    LV: "Latvia",
    LT: "Lithuania",
    LU: "Luxembourg",
    MT: "Malta",
    CY: "Cyprus",
    custom: "Custom",
  };
  return names[location] || location;
}

export function getBusinessTypeName(businessType: BusinessType): string {
  const names: Record<BusinessType, string> = {
    "sole-trader": "Sole Trader",
    llc: "LLC",
    corporation: "Corporation",
    partnership: "Partnership",
    "self-employed": "Self-Employed",
  };
  return names[businessType] || businessType;
}

