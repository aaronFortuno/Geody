import type { FC } from "react";
import { Button } from "../UI/index.js";

interface HomeScreenProps {
  onCreateRoom: () => void;
  onJoinRoom: () => void;
}

/**
 * Pantalla d'inici de Geody.
 *
 * Contingut:
 * - Logo "Geody" (SVG o text estilitzat)
 * - Subtítol: "El joc de geografia per a aules"
 * - Globus decoratiu animat de fons (Globe amb autoRotate=true, sense interacció)
 * - Dos botons prominents: "Crear Sala" | "Unir-se a una Sala"
 *
 * No gestiona estat; delega les accions al pare (App.tsx).
 */
export const HomeScreen: FC<HomeScreenProps> = ({ onCreateRoom, onJoinRoom }) => {
  return (
    <main className="home-screen">
      <div className="home-screen__globe" aria-hidden="true" />
      <section className="home-screen__content">
        <h1>Geody</h1>
        <p>El joc de geografia per a aules</p>
        <div className="home-screen__actions">
          <Button size="lg" onClick={onCreateRoom}>
            Crear Sala
          </Button>
          <Button size="lg" variant="secondary" onClick={onJoinRoom}>
            Unir-se a una Sala
          </Button>
        </div>
      </section>
    </main>
  );
};
