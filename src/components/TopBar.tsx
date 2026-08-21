import { Proyecto } from "../types";
import { ProjectSelector } from "./ProjectSelector";
import { RoleToggle } from "./RoleToggle";
import { useProjectStore } from "../store/useProjectStore";

export function TopBar({ project }: { project: Proyecto }) {
  const resetDemo = useProjectStore((state) => state.resetDemo);

  return (
    <header className="sticky top-0 z-30 border-b border-line/80 bg-white/92 backdrop-blur">
      <div className="mx-auto grid min-h-[72px] w-[min(100%-32px,1480px)] grid-cols-[auto_1fr_auto] items-center gap-4">
        <div className="brand-lockup">
          <img className="brand-logo" src={`${import.meta.env.BASE_URL}nava-logo.png`} alt="Nava" />
          <div>
            <strong>Nava GISTM</strong>
            <span>{project.nombre}</span>
          </div>
        </div>
        <ProjectSelector />
        <div className="flex items-center gap-2">
          <RoleToggle />
          <button className="icon-action" title="Reiniciar demo" onClick={resetDemo} aria-label="Reiniciar demo">
            ↻
          </button>
        </div>
      </div>
    </header>
  );
}
