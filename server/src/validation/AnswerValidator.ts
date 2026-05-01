import type { CountryData } from "@geody/shared";

export interface ValidationResult {
  isCorrect: boolean;
  isSpellingPerfect: boolean;
  /** ISO3 del pais si la resposta és incorrecta però identifica un pais real (per al flaix). */
  flashCountryId?: string;
}

export class AnswerValidator {
  /**
   * Valida la resposta d'un jugador.
   *
   * Algorisme en dos passos:
   *   1. normalize(answer) === normalize(correctAnswer)
   *      → isCorrect = true
   *      → També comprova variants acceptades (acceptedVariants)
   *   2. answer === correctAnswer (comparació exacta, caràcter a caràcter)
   *      → isSpellingPerfect = true
   *
   * Si isCorrect = false, cerca si la resposta correspon a un pais real
   * (per proporcionar flashCountryId al globus).
   *
   * @param answer        Text raw enviat pel jugador
   * @param correctAnswer Nom oficial en el locale actiu
   * @param roundType     "country" o "capital" (indica en quin camp cercar flashCountryId)
   * @param locale        Locale actiu
   * @param allCountries  Dataset complet (per findCountryByAnswer)
   */
  validate(
    answer: string,
    correctAnswer: string,
    roundType: "country" | "capital",
    locale: string,
    allCountries: CountryData[]
  ): ValidationResult {
    const normalizedAnswer = this.normalize(answer);
    const normalizedCorrect = this.normalize(correctAnswer);
    const targetCountry = allCountries.find((country) => {
      const localeData = country.names[locale];
      if (!localeData) {
        return false;
      }
      const field = roundType === "country" ? localeData.country : localeData.capital;
      return this.normalize(field) === normalizedCorrect;
    });
    const localeData = targetCountry?.names[locale];
    const variantSource =
      roundType === "country"
        ? localeData?.acceptedCountryVariants ?? []
        : localeData?.acceptedCapitalVariants ?? localeData?.acceptedVariants ?? [];
    const variants = variantSource.map((variant) => this.normalize(variant));
    const isCorrect =
      normalizedAnswer === normalizedCorrect || variants.includes(normalizedAnswer);
    const isSpellingPerfect = isCorrect && answer.trim() === correctAnswer;
    const flashCountryId = isCorrect
      ? undefined
      : this.findCountryByAnswer(normalizedAnswer, roundType, locale, allCountries);
    return {
      isCorrect,
      isSpellingPerfect,
      flashCountryId,
    };
  }

  /**
   * Normalitza un text per a comparació tolerant.
   *
   * Passos en ordre:
   *   1. trim()
   *   2. toLowerCase()
   *   3. normalize("NFD")                      → separa base + diacrític
   *   4. replace(/[̀-ͯ]/g, "")       → elimina diacrítics (accents, cedilles...)
   *   5. replace(/\s+/g, " ")                  → col·lapsa espais múltiples
   *
   * CRÍTIC: Ha de ser idèntica a client/src/utils/normalize.ts.
   */
  normalize(text: string): string {
    return text
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/\s+/g, " ");
  }

  /**
   * Cerca un pais pel seu nom normalitzat (país o capital) en el locale donat.
   * Usat per trobar el flashCountryId quan la resposta és incorrecta però real.
   *
   * @param normalizedAnswer  Resposta ja normalitzada
   * @param roundType         "country" → cerca per nom de país; "capital" → per capital
   * @param locale            Locale actiu
   * @param allCountries      Dataset complet
   * @returns                 ISO3 del pais trobat, o undefined si no es reconeix
   */
  findCountryByAnswer(
    normalizedAnswer: string,
    roundType: "country" | "capital",
    locale: string,
    allCountries: CountryData[]
  ): string | undefined {
    for (const country of allCountries) {
      const localeData = country.names[locale];
      if (!localeData) {
        continue;
      }
      const field = roundType === "country" ? localeData.country : localeData.capital;
      if (this.normalize(field) === normalizedAnswer) {
        return country.id;
      }
      const variants =
        roundType === "country"
          ? localeData.acceptedCountryVariants ?? []
          : localeData.acceptedCapitalVariants ?? localeData.acceptedVariants ?? [];
      if (variants.some((variant) => this.normalize(variant) === normalizedAnswer)) {
        return country.id;
      }
    }
    return undefined;
  }
}
