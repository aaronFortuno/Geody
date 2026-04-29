/**
 * Normalitza un text per a comparació tolerant d'ortografia.
 *
 * CRÍTIC: Aquest algorisme ha de ser idèntic al d'AnswerValidator.normalize()
 * al servidor. Qualsevol canvi aquí s'ha de replicar allà.
 *
 * Passos en ordre:
 *   1. trim()
 *   2. toLowerCase()
 *   3. normalize("NFD")         → separa caràcter base + diacrític
 *   4. elimina diacrítics       → /[̀-ͯ]/g
 *   5. col·lapsa espais         → /\s+/g → " "
 *
 * Exemples:
 *   normalize("  França ") → "franca"
 *   normalize("ESPANYA")   → "espanya"
 *   normalize("Nova Zelanda") → "nova zelanda"
 */
export function normalize(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}
