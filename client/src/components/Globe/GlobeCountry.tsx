import { useEffect, useMemo } from "react";
import type { FC } from "react";
import * as THREE from "three";
import type { GeoJSONCountryFeature, GeoJSONGeometry } from "../../types/index.js";

interface GlobeCountryProps {
  feature: GeoJSONCountryFeature;
  isTarget: boolean;
  isFlashing: boolean;
  onFlashComplete: () => void;
  onClick?: (countryId: string) => void;
}

const BORDER_RADIUS = 1.009;

export const GlobeCountry: FC<GlobeCountryProps> = ({
  feature,
  isTarget,
  isFlashing,
  onFlashComplete,
  onClick,
}) => {
  const countryId = String(feature.properties?.["ADM0_A3"] ?? "");
  const color = isFlashing ? "#ff4444" : isTarget ? "#ffd700" : "#0b2530";
  const borderGeometries = useMemo(() => buildCountryBorders(feature.geometry), [feature.geometry]);
  const borderLines = useMemo(
    () =>
      borderGeometries.map(
        (geometry) => new THREE.Line(geometry, new THREE.LineBasicMaterial({ color }))
      ),
    [borderGeometries, color]
  );

  useEffect(() => {
    if (!isFlashing) return undefined;
    const timeout = window.setTimeout(onFlashComplete, 1500);
    return () => window.clearTimeout(timeout);
  }, [isFlashing, onFlashComplete]);

  return (
    <group onClick={() => onClick?.(countryId)}>
      {borderLines.map((line, index) => (
        <primitive key={index} object={line} />
      ))}
    </group>
  );
};

function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

function normalizeRing(ring: number[][]): number[][] {
  if (ring.length < 3) return [];
  const points = ring
    .slice(0, -1)
    .filter((point): point is number[] => Array.isArray(point) && point.length >= 2)
    .map(([lng, lat]) => [Number(lng), Number(lat)]);
  if (points.length < 3) return [];

  const normalized: number[][] = [[points[0][0] as number, points[0][1] as number]];
  for (let i = 1; i < points.length; i += 1) {
    const previousLng = normalized[i - 1]?.[0] as number;
    let nextLng = points[i]?.[0] as number;
    const lat = points[i]?.[1] as number;
    while (nextLng - previousLng > 180) nextLng -= 360;
    while (nextLng - previousLng < -180) nextLng += 360;
    normalized.push([nextLng, lat]);
  }
  return normalized;
}

function buildBorderGeometry(ring: number[][]): THREE.BufferGeometry | null {
  if (ring.length < 3) return null;
  const vertices: number[] = [];
  for (const [lngRaw, lat] of ring) {
    const lng = ((((lngRaw + 180) % 360) + 360) % 360) - 180;
    const point = latLngToVector3(lat, lng, BORDER_RADIUS);
    vertices.push(point.x, point.y, point.z);
  }
  const first = ring[0];
  if (first) {
    const lng = ((((first[0] + 180) % 360) + 360) % 360) - 180;
    const start = latLngToVector3(first[1], lng, BORDER_RADIUS);
    vertices.push(start.x, start.y, start.z);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  return geometry;
}

function buildCountryBorders(geometry: GeoJSONGeometry): THREE.BufferGeometry[] {
  const polygons =
    geometry.type === "Polygon"
      ? [geometry.coordinates]
      : geometry.type === "MultiPolygon"
        ? geometry.coordinates
        : [];

  const borderGeometries: THREE.BufferGeometry[] = [];
  for (const polygon of polygons) {
    for (const ring of polygon) {
      const normalized = normalizeRing(ring);
      const borderGeometry = buildBorderGeometry(normalized);
      if (borderGeometry) borderGeometries.push(borderGeometry);
    }
  }
  return borderGeometries;
}
