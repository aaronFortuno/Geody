// Re-exporta tots els tipus compartits per a ús intern del client.
// Afegeix aquí tipus exclusius del client si cal.
export * from "@geody/shared";

export type GeoJSONGeometry =
  | { type: "Polygon"; coordinates: number[][][] }
  | { type: "MultiPolygon"; coordinates: number[][][][] };

/** Tipus de la resposta local del GeoJSON carregat. */
export interface GeoJSONCountryFeature {
  type: "Feature";
  properties: {
    ADM0_A3: string;    // ISO3 (coincideix amb CountryData.id)
    NAME: string;       // Nom en anglès (no usar per al joc, només per a debug)
  };
  geometry: GeoJSONGeometry;
}
