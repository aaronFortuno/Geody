// Shared types for client usage.
export * from "@geody/shared";

export type GeoJSONGeometry =
  | { type: "Polygon"; coordinates: number[][][] }
  | { type: "MultiPolygon"; coordinates: number[][][][] };

/** Shape of country features loaded from local Natural Earth GeoJSON files. */
export interface GeoJSONCountryFeature {
  type: "Feature";
  properties: {
    ISO_A3?: string; // Canonical ISO3 code.
    ADM0_A3: string; // Natural Earth legacy code (fallback).
    NAME: string;
  };
  geometry: GeoJSONGeometry;
}
