import type { CountryData, GameConfig, Round, Continent } from "@geody/shared";

type RoundStub = Omit<Round, "startedAt" | "endedAt" | "answers">;

export class RoundGenerator {
  /**
   * Pre-genera totes les rondes d'una partida a partir de la configuració.
   *
   * Regles:
   * - Filtra els paisos pels continents seleccionats a config.continents
   * - Selecciona config.totalRounds paisos sense repeticions (shuffle Fisher-Yates)
   * - Si mode="countries" → totes les rondes de tipus "country"
   * - Si mode="capitals"  → totes les rondes de tipus "capital"
   * - Si mode="both"      → alternança country/capital per parells consecutius
   * - correctAnswer s'omple amb el nom oficial del locale actiu
   *
   * @param config    Configuració del joc (inclou locale i continents)
   * @param countries Dataset complet de paisos (ja amb noms del locale actiu merged)
   * @returns         Array de RoundStub, ordenat per index 0..N-1
   * @throws          Error si no hi ha prou paisos per als continents seleccionats
   */
  generateRounds(config: GameConfig, countries: CountryData[]): RoundStub[] {
    const filtered = countries.filter((country) =>
      config.continents.includes(country.continent)
    );
    if (filtered.length < config.totalRounds) {
      throw new Error("Not enough countries");
    }
    const selected = this.selectCountries(config.continents, config.totalRounds, countries);
    return selected.map((country, index) => {
      const type =
        config.mode === "countries"
          ? "country"
          : config.mode === "capitals"
            ? "capital"
            : index % 2 === 0
              ? "country"
              : "capital";
      const localeNames = country.names[config.locale];
      if (!localeNames) {
        throw new Error(`Missing locale data for ${country.id} (${config.locale})`);
      }
      const correctAnswer = type === "country" ? localeNames.country : localeNames.capital;
      return {
        index,
        type,
        targetCountryId: country.id,
        correctAnswer,
      };
    });
  }

  /**
   * Selecciona `count` paisos aleatoris dels continents indicats.
   * Aplica shuffle Fisher-Yates sobre els paisos filtrats, retorna els primers `count`.
   *
   * @throws Error si filtered.length < count
   */
  private selectCountries(
    continents: Continent[],
    count: number,
    countries: CountryData[]
  ): CountryData[] {
    const filtered = countries.filter((country) => continents.includes(country.continent));
    if (filtered.length < count) {
      throw new Error("Not enough countries");
    }
    const shuffled = [...filtered];
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = shuffled[i];
      shuffled[i] = shuffled[j] as CountryData;
      shuffled[j] = temp as CountryData;
    }
    return shuffled.slice(0, count);
  }
}
