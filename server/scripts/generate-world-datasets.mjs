import { readFile, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "../..");

const geoJsonPath = resolve(rootDir, "client/public/data/ne_10m_admin_0_countries.geojson");
const capitalsPath = resolve(rootDir, "client/public/data/capitals.json");
const serverCountriesPath = resolve(rootDir, "server/src/data/countries.json");
const clientCountriesPath = resolve(rootDir, "client/public/data/countries.json");
const localeCaPath = resolve(rootDir, "server/src/data/locales/ca.json");
const localeEsPath = resolve(rootDir, "server/src/data/locales/es.json");
const localeEnPath = resolve(rootDir, "server/src/data/locales/en.json");

const CONTINENT_MAP = {
  Africa: "africa",
  Asia: "asia",
  Europe: "europe",
  "North America": "north-america",
  "South America": "south-america",
  Oceania: "oceania",
};

const MANUAL_CAPITALS = {
  MAC: "Macau",
};

function round(value, decimals = 4) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function uniqueStrings(values) {
  return [...new Set(values.filter((value) => typeof value === "string" && value.trim().length > 0))];
}

function composeLocaleEntry(existingEntry, country, capital) {
  const result = { country, capital };
  const acceptedVariants = uniqueStrings(existingEntry?.acceptedVariants ?? []);
  const acceptedCountryVariants = uniqueStrings(existingEntry?.acceptedCountryVariants ?? []);
  const acceptedCapitalVariants = uniqueStrings(existingEntry?.acceptedCapitalVariants ?? []);

  const previousCountry = String(existingEntry?.country ?? "").trim();
  if (previousCountry && previousCountry !== country) {
    acceptedCountryVariants.push(previousCountry);
  }

  const previousCapital = String(existingEntry?.capital ?? "").trim();
  if (previousCapital && previousCapital !== capital) {
    acceptedCapitalVariants.push(previousCapital);
  }

  if (acceptedVariants.length > 0) result.acceptedVariants = acceptedVariants;
  if (acceptedCountryVariants.length > 0) {
    result.acceptedCountryVariants = uniqueStrings(acceptedCountryVariants);
  }
  if (acceptedCapitalVariants.length > 0) {
    result.acceptedCapitalVariants = uniqueStrings(acceptedCapitalVariants);
  }

  return result;
}

const [geoJsonRaw, capitalsRaw, localeCaRaw, localeEsRaw, localeEnRaw] = await Promise.all([
  readFile(geoJsonPath, "utf8"),
  readFile(capitalsPath, "utf8"),
  readFile(localeCaPath, "utf8"),
  readFile(localeEsPath, "utf8"),
  readFile(localeEnPath, "utf8"),
]);

const geoJson = JSON.parse(geoJsonRaw);
const capitals = JSON.parse(capitalsRaw);
const existingCa = JSON.parse(localeCaRaw);
const existingEs = JSON.parse(localeEsRaw);
const existingEn = JSON.parse(localeEnRaw);

const capitalsById = new Map(capitals.map((entry) => [String(entry.id), entry]));
const features = Array.isArray(geoJson.features) ? geoJson.features : [];

const countries = [];
const localeCa = {};
const localeEs = {};
const localeEn = {};

const seenIds = new Set();

for (const feature of features) {
  const properties = feature?.properties ?? {};
  const type = String(properties.TYPE ?? "");
  if (type !== "Sovereign country" && type !== "Country") {
    continue;
  }

  const continent = CONTINENT_MAP[properties.CONTINENT];
  if (!continent) {
    continue;
  }

  const id = String(properties.ISO_A3 ?? "");
  const iso2 = String(properties.ISO_A2 ?? "");
  if (!id || id === "-99" || !iso2 || iso2 === "-99") {
    continue;
  }
  if (seenIds.has(id)) {
    continue;
  }
  seenIds.add(id);

  const capitalInfo = capitalsById.get(id);
  const capitalFromMap = capitalInfo?.capital ?? MANUAL_CAPITALS[id];
  if (!capitalFromMap) {
    continue;
  }

  const labelLat = Number(properties.LABEL_Y);
  const labelLng = Number(properties.LABEL_X);
  const fallbackLat = Number(capitalInfo?.coordinates?.lat);
  const fallbackLng = Number(capitalInfo?.coordinates?.lng);
  const lat = Number.isFinite(labelLat) ? labelLat : fallbackLat;
  const lng = Number.isFinite(labelLng) ? labelLng : fallbackLng;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    continue;
  }

  countries.push({
    id,
    iso2,
    continent,
    coordinates: {
      lat: round(lat),
      lng: round(lng),
    },
  });

  const countryEn = String(properties.NAME_EN ?? properties.NAME ?? properties.ADMIN ?? id);
  const countryEs = String(properties.NAME_ES ?? countryEn);
  const capitalEn = String(existingEn[id]?.capital ?? capitalFromMap);
  const capitalEs = String(existingEs[id]?.capital ?? capitalEn);
  const capitalCa = String(existingCa[id]?.capital ?? capitalEs);
  const countryCa = String(existingCa[id]?.country ?? countryEs);

  localeEn[id] = composeLocaleEntry(existingEn[id], countryEn, capitalEn);
  localeEs[id] = composeLocaleEntry(existingEs[id], countryEs, capitalEs);
  localeCa[id] = composeLocaleEntry(existingCa[id], countryCa, capitalCa);
}

countries.sort((a, b) => a.id.localeCompare(b.id));

const sortObjectByKey = (value) =>
  Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)));

const sortedCa = sortObjectByKey(localeCa);
const sortedEs = sortObjectByKey(localeEs);
const sortedEn = sortObjectByKey(localeEn);

const json = (value) => `${JSON.stringify(value, null, 2)}\n`;

await Promise.all([
  writeFile(serverCountriesPath, json(countries), "utf8"),
  writeFile(clientCountriesPath, json(countries), "utf8"),
  writeFile(localeCaPath, json(sortedCa), "utf8"),
  writeFile(localeEsPath, json(sortedEs), "utf8"),
  writeFile(localeEnPath, json(sortedEn), "utf8"),
]);

console.log(`Generated countries: ${countries.length}`);
