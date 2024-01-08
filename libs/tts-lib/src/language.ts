export class Language {
  constructor(public code: string, public language: string, public region: string) {}

  getBaseLanguageCode(): string {
    return this.code.split('-')[0];
  }

  getRegionCode(): string {
    return this.code.split('-')[1];
  }
}

export const SupportedLanguages: Record<string, Language> = {
  'en-AU': new Language('en-AU', 'English', 'Australia'),
  'en-CA': new Language('en-CA', 'English', 'Canada'),
  'en-GB': new Language('en-GB', 'English', 'United Kingdom'),
  'en-US': new Language('en-US', 'English', 'United States'),
  // 'en-ZA': new Language('en-ZA', 'English', 'South Africa'),
  'es-MX': new Language('es-MX', 'Spanish', 'Mexico'),
  'es-US': new Language('es-US', 'Spanish', 'United States'),
  // 'fr-CA': new Language('fr-CA', 'French', 'Canada'),
};
