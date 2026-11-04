import { Proyecto } from "../types";
import { ProjectSelector } from "./ProjectSelector";
import { useProjectStore } from "../store/useProjectStore";
import type { AppView } from "../store/useProjectStore";
import { MaterialIcon } from "./ui/primitives";

export function TopBar({ project, view, viewLabel, onOpenMenu, onOpenMentat }: {
  project: Proyecto;
  view: AppView;
  viewLabel: string;
  onOpenMenu: () => void;
  onOpenMentat: () => void;
}) {
  const resetDemo = useProjectStore((state) => state.resetDemo);
  const cutoff = project.fechaCorte || (project.fechaEvaluacion
    ? new Intl.DateTimeFormat("es-CL", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${project.fechaEvaluacion}T12:00:00`))
    : "Sin fecha");

  return (
    <header className="nava-topbar">
      <div className="nava-topbar__left">
        <button className="nava-menu-trigger" type="button" onClick={onOpenMenu} aria-label="Abrir menú">
          <MaterialIcon name="menu" />
        </button>
        <div className="nava-topbar__crumb"><span>GISTM Tracker</span><MaterialIcon name="chevron_right" /><strong>{viewLabel}</strong></div>
      </div>
      <div className="nava-topbar__project">
        <ProjectSelector />
      </div>
      <div className="nava-topbar__actions">
        <span className="nava-topbar__cut"><MaterialIcon name="calendar_today" />Corte · {cutoff}</span>
        <span className="nava-role-chip"><MaterialIcon name={view === "analista" ? "edit_note" : "visibility"} />{view === "analista" ? "Analista" : "Gerencia · lectura"}</span>
        <button className="nava-mentat-action" type="button" onClick={onOpenMentat}><MaterialIcon name="forum" /><span>Mentat</span></button>
        <button className="icon-action nava-reset-action" title="Reiniciar demo" onClick={resetDemo} aria-label="Reiniciar demo"><MaterialIcon name="refresh" /></button>
      </div>
    </header>
  );
}
