import { useCallback, useEffect, useState, type FC } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { GlobeCountry } from "./GlobeCountry.js";
import type { GeoJSONCountryFeature } from "../../types/index.js";

interface GlobeProps {
  targetCountryId?: string;
  flashCountryId?: string;
  autoRotate: boolean;
  onCountryClick?: (countryId: string) => void;
}

export const Globe: FC<GlobeProps> = ({
  targetCountryId,
  flashCountryId,
  autoRotate,
  onCountryClick,
}) => {
  const [features, setFeatures] = useState<GeoJSONCountryFeature[]>([]);

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

  const handleFlashComplete = useCallback(() => undefined, []);

  return (
    <Canvas camera={{ position: [0, 0, 2.5], fov: 45 }}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <mesh>
        <sphereGeometry args={[1, 64, 64]} />
        <meshPhongMaterial color="#1a6b8a" shininess={8} />
      </mesh>
      <group rotation={[0, autoRotate ? 0.15 : 0, 0]}>
        {features.map((feature) => {
          const countryId = String(feature.properties?.["ADM0_A3"] ?? "");
          return (
            <GlobeCountry
              key={countryId}
              feature={feature}
              isTarget={countryId === targetCountryId}
              isFlashing={countryId === flashCountryId}
              onFlashComplete={handleFlashComplete}
              onClick={onCountryClick}
            />
          );
        })}
      </group>
      <OrbitControls enablePan={false} minDistance={1.5} maxDistance={4} />
    </Canvas>
  );
};
