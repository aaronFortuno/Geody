import { createRequire } from "module";
import type { CountryData, Continent } from "@geody/shared";

const require = createRequire(import.meta.url);

export interface LocaleEntry {
  country: string;
  capital: string;
  acceptedVariants?: string[];
  acceptedCountryVariants?: string[];
  acceptedCapitalVariants?: string[];
}

export type LocaleData = Record<string, LocaleEntry>;

type BaseCountry = Omit<CountryData, "names">;

export class CountryLoader {
  private countriesCache?: BaseCountry[];
  private readonly localeCache = new Map<string, LocaleData>();

  /**
   * Carrega el dataset base de paisos (countries.json).
   * Retorna objectes sense el camp `names` (afegit per getCountriesForLocale).
   * Memòria cau: es carrega només una vegada.
   */
  loadCountries(): BaseCountry[] {
    if (this.countriesCache) {
      return this.countriesCache;
    }
    this.countriesCache = require("../data/countries.json") as BaseCountry[];
    return this.countriesCache;
  }

  /**
   * Carrega el fitxer de locale (locales/{locale}.json).
   * Memòria cau per locale.
   * @throws Error si el fitxer no existeix
   */
  loadLocale(locale: string): LocaleData {
    const cached = this.localeCache.get(locale);
    if (cached) {
      return cached;
    }
    try {
      const data = require(`../data/locales/${locale}.json`) as LocaleData;
      this.localeCache.set(locale, data);
      return data;
    } catch {
      throw new Error(`Locale not found: ${locale}`);
    }
  }

  /**
   * Retorna el dataset complet de paisos fusionat amb els noms del locale donat.
   * Estructura resultant: CountryData[] on names = { [locale]: LocaleEntry }
   *
   * NOTA: Només inclou paisos que existeixin tant a countries.json com al locale.
   */
  getCountriesForLocale(locale: string): CountryData[] {
    const base = this.loadCountries();
    const localeData = this.loadLocale(locale);
    return base
      .filter((country) => localeData[country.id])
      .map((country) => ({
        ...country,
        names: {
          [locale]: localeData[country.id] as LocaleEntry,
        },
      }));
  }

  /**
   * Retorna el nom oficial del país en el locale donat.
   * @throws Error si l'id o el locale no es troben
   */
  getCountryName(id: string, locale: string): string {
    const localeData = this.loadLocale(locale);
    const entry = localeData[id];
    if (!entry) {
      throw new Error(`Country ${id} not found in locale ${locale}`);
    }
    return entry.country;
  }

  /**
   * Retorna el nom oficial de la capital en el locale donat.
   * @throws Error si l'id o el locale no es troben
   */
  getCapitalName(id: string, locale: string): string {
    const localeData = this.loadLocale(locale);
    const entry = localeData[id];
    if (!entry) {
      throw new Error(`Country ${id} not found in locale ${locale}`);
    }
    return entry.capital;
  }

  /**
   * Retorna els paisos filtrats per continent.
   * Util per a diagnòstic o per a generar estadístiques.
   */
  getCountriesByContinent(continent: Continent, locale: string): CountryData[] {
    return this.getCountriesForLocale(locale).filter((country) => country.continent === continent);
  }
}
