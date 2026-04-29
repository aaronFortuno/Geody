import { useEffect, useMemo, useRef, useState, type FC, type MutableRefObject, type RefObject } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import { geoEquirectangular, geoPath } from "d3-geo";
import type { GeoJSONCountryFeature } from "../../types/index.js";

interface GlobeProps {
  targetCountryId?: string;
  flashCountryId?: string;
  autoRotate: boolean;
  onCountryClick?: (countryId: string) => void;
}

const BORDER_RADIUS = 1.003;

export const Globe: FC<GlobeProps> = ({ targetCountryId, flashCountryId, autoRotate, onCountryClick }) => {
  void onCountryClick;
  const [features, setFeatures] = useState<GeoJSONCountryFeature[]>([]);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const isInteractingRef = useRef(false);
  const targetVectorRef = useRef<THREE.Vector3 | null>(null);
  const shouldFocusRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const baseUrl = import.meta.env.BASE_URL ?? "/";
    fetch(`${baseUrl}data/ne_110m_admin_0_countries.geojson`)
      .then((response) => response.json() as Promise<{ features: GeoJSONCountryFeature[] }>)
      .then((geojson) => {
        if (!cancelled) setFeatures(geojson.features);
      })
      .catch((error) => console.error("Error carregant GeoJSON", error));
    return () => {
      cancelled = true;
    };
  }, []);

  const countryCenters = useMemo(() => buildCountryCenters(features), [features]);
  const mapTexture = useMemo(
    () => createMapTexture(features, targetCountryId, flashCountryId),
    [features, targetCountryId, flashCountryId]
  );
  const borderLines = useMemo(() => buildBorderLines(features), [features]);
  useEffect(() => () => mapTexture.dispose(), [mapTexture]);

  useEffect(() => {
    if (!targetCountryId) {
      targetVectorRef.current = null;
      shouldFocusRef.current = false;
      return;
    }
    const center = countryCenters.get(targetCountryId);
    if (!center) {
      targetVectorRef.current = null;
      shouldFocusRef.current = false;
      return;
    }
    targetVectorRef.current = latLngToVector3(center.lat, center.lng, 1).normalize();
    shouldFocusRef.current = autoRotate;
  }, [autoRotate, countryCenters, targetCountryId]);

  return (
    <Canvas camera={{ position: [0, 0, 2.5], fov: 45 }}>
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <group>
        <mesh>
          <sphereGeometry args={[1, 96, 96]} />
          <meshPhongMaterial map={mapTexture} shininess={10} />
        </mesh>
        {borderLines.map((line, index) => (
          <primitive key={index} object={line} />
        ))}
      </group>
      <GlobeAnimator
        controlsRef={controlsRef}
        autoRotate={autoRotate}
        isInteractingRef={isInteractingRef}
        targetVectorRef={targetVectorRef}
        shouldFocusRef={shouldFocusRef}
      />
      <ControlsTuner controlsRef={controlsRef} />
      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        minDistance={1.15}
        maxDistance={4}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.75}
        zoomSpeed={0.8}
        onStart={() => {
          isInteractingRef.current = true;
          shouldFocusRef.current = false;
        }}
        onEnd={() => {
          isInteractingRef.current = false;
        }}
      />
    </Canvas>
  );
};

const GlobeAnimator: FC<{
  controlsRef: RefObject<OrbitControlsImpl | null>;
  autoRotate: boolean;
  isInteractingRef: MutableRefObject<boolean>;
  targetVectorRef: MutableRefObject<THREE.Vector3 | null>;
  shouldFocusRef: MutableRefObject<boolean>;
}> = ({ controlsRef, autoRotate, isInteractingRef, targetVectorRef, shouldFocusRef }) => {
  useFrame((state, delta) => {
    const controls = controlsRef.current;
    if (!controls) return;

    if (autoRotate && shouldFocusRef.current && !isInteractingRef.current && targetVectorRef.current) {
      const distance = controls.getDistance();
      const desiredPos = targetVectorRef.current.clone().multiplyScalar(distance);
      const alpha = 1 - Math.exp(-delta * 2.6);
      state.camera.position.lerp(desiredPos, alpha);
      controls.target.set(0, 0, 0);
      controls.update();
      if (state.camera.position.distanceTo(desiredPos) < 0.01) {
        state.camera.position.copy(desiredPos);
        shouldFocusRef.current = false;
      }
    }
  });
  return null;
};

const ControlsTuner: FC<{ controlsRef: RefObject<OrbitControlsImpl | null> }> = ({ controlsRef }) => {
  useFrame(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const zoomRange = controls.maxDistance - controls.minDistance;
    const zoomT =
      zoomRange > 0
        ? Math.max(0, Math.min(1, (controls.maxDistance - controls.getDistance()) / zoomRange))
        : 0;
    controls.rotateSpeed = 0.75 - zoomT * 0.5;
    controls.zoomSpeed = 0.8 - zoomT * 0.3;
  });
  return null;
};

function createMapTexture(
  features: GeoJSONCountryFeature[],
  targetCountryId?: string,
  flashCountryId?: string
): THREE.CanvasTexture {
  const width = 4096;
  const height = 2048;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.fillStyle = "#1a6b8a";
  ctx.fillRect(0, 0, width, height);

  const projection = geoEquirectangular()
    .scale(width / (2 * Math.PI))
    .translate([width / 2, height / 2]);
  const path = geoPath(projection, ctx);

  for (const feature of features) {
    const countryId = String(feature.properties?.["ADM0_A3"] ?? "");
    const isFlashing = countryId === flashCountryId;
    const isTarget = countryId === targetCountryId;
    ctx.fillStyle = isFlashing ? "#ff4444" : isTarget ? "#ffd700" : "#8fbc8f";
    ctx.beginPath();
    path(rewindFeatureForD3(feature));
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

function rewindFeatureForD3(feature: GeoJSONCountryFeature): any {
  const geometry = feature.geometry;
  if (geometry.type === "Polygon") {
    return {
      type: "Feature",
      properties: feature.properties,
      geometry: {
        type: "Polygon",
        coordinates: geometry.coordinates.map((ring) => [...ring].reverse()),
      },
    };
  }
  if (geometry.type === "MultiPolygon") {
    return {
      type: "Feature",
      properties: feature.properties,
      geometry: {
        type: "MultiPolygon",
        coordinates: geometry.coordinates.map((polygon) =>
          polygon.map((ring) => [...ring].reverse())
        ),
      },
    };
  }
  return feature as any;
}

function buildBorderLines(features: GeoJSONCountryFeature[]): THREE.Line[] {
  const lines: THREE.Line[] = [];
  for (const feature of features) {
    const polys =
      feature.geometry.type === "Polygon"
        ? [feature.geometry.coordinates]
        : feature.geometry.type === "MultiPolygon"
          ? feature.geometry.coordinates
          : [];
    for (const polygon of polys) {
      for (const ring of polygon) {
        const normalized = normalizeRing(ring);
        if (normalized.length < 3) continue;
        const geometry = new THREE.BufferGeometry();
        const vertices: number[] = [];
        for (const [lngRaw, lat] of normalized) {
          const lng = ((((lngRaw + 180) % 360) + 360) % 360) - 180;
          const point = latLngToVector3(lat, lng, BORDER_RADIUS);
          vertices.push(point.x, point.y, point.z);
        }
        const first = normalized[0];
        if (first) {
          const lng = ((((first[0] + 180) % 360) + 360) % 360) - 180;
          const point = latLngToVector3(first[1], lng, BORDER_RADIUS);
          vertices.push(point.x, point.y, point.z);
        }
        geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
        lines.push(new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: "#0b2530" })));
      }
    }
  }
  return lines;
}

function buildCountryCenters(features: GeoJSONCountryFeature[]): Map<string, { lat: number; lng: number }> {
  const map = new Map<string, { lat: number; lng: number }>();
  for (const feature of features) {
    const countryId = String(feature.properties?.["ADM0_A3"] ?? "");
    const polys =
      feature.geometry.type === "Polygon"
        ? [feature.geometry.coordinates]
        : feature.geometry.type === "MultiPolygon"
          ? feature.geometry.coordinates
          : [];
    let sum = new THREE.Vector3();
    let count = 0;
    for (const polygon of polys) {
      const outer = normalizeRing(polygon[0] ?? []);
      for (const [lngRaw, lat] of outer) {
        const lng = ((((lngRaw + 180) % 360) + 360) % 360) - 180;
        sum = sum.add(latLngToVector3(lat, lng, 1));
        count += 1;
      }
    }
    if (count === 0) continue;
    sum = sum.normalize();
    const lat = 90 - (Math.acos(sum.y) * 180) / Math.PI;
    const rawLng = (Math.atan2(sum.z, -sum.x) * 180) / Math.PI - 180;
    const lng = ((((rawLng + 180) % 360) + 360) % 360) - 180;
    map.set(countryId, { lat, lng });
  }
  return map;
}

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
