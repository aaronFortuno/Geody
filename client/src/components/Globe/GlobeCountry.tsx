import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
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

export const GlobeCountry: FC<GlobeCountryProps> = ({
  feature,
  isTarget,
  isFlashing,
  onFlashComplete,
  onClick,
}) => {
  const materialRef = useRef<THREE.MeshPhongMaterial>(null);
  const countryId = String(feature.properties?.["ADM0_A3"] ?? "");
  const geometries = useMemo(() => buildCountryGeometries(feature.geometry), [feature.geometry]);

  useEffect(() => {
    if (!isFlashing) return undefined;
    const timeout = window.setTimeout(onFlashComplete, 1500);
    return () => window.clearTimeout(timeout);
  }, [isFlashing, onFlashComplete]);

  useFrame(({ clock }) => {
    if (!materialRef.current) return;
    materialRef.current.emissiveIntensity = isTarget
      ? 0.3 + 0.3 * Math.sin(clock.elapsedTime * 3)
      : isFlashing
        ? 0.45
        : 0;
  });

  const color = isFlashing ? "#ff4444" : isTarget ? "#ffd700" : "#8fbc8f";
  const emissive = isFlashing ? "#ff0000" : isTarget ? "#ffa500" : "#000000";

  return (
    <group onClick={() => onClick?.(countryId)}>
      {geometries.map((geometry, index) => (
        <mesh key={index} geometry={geometry}>
          <meshPhongMaterial
            ref={index === 0 ? materialRef : undefined}
            color={color}
            emissive={emissive}
            shininess={4}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
};

function latLngToVector3(lat: number, lng: number, radius = 1.006): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

function buildCountryGeometries(geometry: GeoJSONGeometry): THREE.BufferGeometry[] {
  const polygons =
    geometry.type === "Polygon"
      ? [geometry.coordinates]
      : geometry.type === "MultiPolygon"
        ? geometry.coordinates
        : [];

  return polygons
    .map((polygon) => polygon[0])
    .filter((ring): ring is number[][] => Array.isArray(ring) && ring.length >= 3)
    .map((ring) => {
      const vertices: number[] = [];
      const indices: number[] = [];
      const points = ring.map(([lng, lat]) => latLngToVector3(Number(lat), Number(lng)));

      for (const point of points) {
        vertices.push(point.x, point.y, point.z);
      }
      for (let index = 1; index < points.length - 1; index += 1) {
        indices.push(0, index, index + 1);
      }

      const bufferGeometry = new THREE.BufferGeometry();
      bufferGeometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
      bufferGeometry.setIndex(indices);
      bufferGeometry.computeVertexNormals();
      return bufferGeometry;
    });
}
