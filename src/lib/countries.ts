// The calendar and rider data use the three-letter codes of the UCI/IOC (NED, GER, CRO, SLO…).
// Structured data needs ISO 3166-1 alpha-2 codes, which differ for several countries.
export const IOC_TO_ISO2: Record<string, string> = {
  AUS: 'AU', AUT: 'AT', BEL: 'BE', BLR: 'BY', CAN: 'CA', CHN: 'CN', COL: 'CO', CRO: 'HR', CZE: 'CZ',
  DEN: 'DK', ESP: 'ES', EST: 'EE', FIN: 'FI', FRA: 'FR', GBR: 'GB', GER: 'DE', GRE: 'GR', HKG: 'HK',
  HUN: 'HU', IRL: 'IE', ISR: 'IL', ITA: 'IT', JPN: 'JP', LAT: 'LV', LTU: 'LT', LUX: 'LU', MAS: 'MY',
  NED: 'NL', NOR: 'NO', NZL: 'NZ', POL: 'PL', POR: 'PT', ROU: 'RO', RSA: 'ZA', SLO: 'SI', SRB: 'RS',
  SUI: 'CH', SVK: 'SK', SWE: 'SE', TUR: 'TR', UAE: 'AE', UKR: 'UA', USA: 'US',
};

/** ISO alpha-2 code for a UCI/IOC code; throws so a new country can't silently emit a wrong code. */
export function iso2(ioc: string): string {
  const code = IOC_TO_ISO2[ioc];
  if (!code) throw new Error(`Unknown country code "${ioc}": add it to IOC_TO_ISO2 in src/lib/countries.ts`);
  return code;
}

/** English country name for structured data (Intl knows every ISO code). */
export function countryNameEn(ioc: string): string {
  return new Intl.DisplayNames(['en'], { type: 'region' }).of(iso2(ioc)) ?? ioc;
}
