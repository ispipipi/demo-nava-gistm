import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { ManagementInsights } from "../lib/managementDashboard";
import type { AppView } from "../store/useProjectStore";
import type { Proyecto } from "../types";
import { MaterialIcon } from "./ui/primitives";
import { ProjectSelector } from "./ProjectSelector";
import { TopBar } from "./TopBar";

const managementItems: Array<{ view: AppView; label: string; icon: string }> = [
  { view: "resumen", label: "Resumen gerencial", icon: "space_dashboard" },
  { view: "avance", label: "Curva de avance", icon: "monitoring" },
  { view: "warnings", label: "Warnings", icon: "notifications" },
  { view: "documentos", label: "Documentos", icon: "folder_open" },
  { view: "criterios", label: "Principios críticos", icon: "flag" }
];

export function AppShell({ project, view, insights, onViewChange, onOpenMentat, children }: {
  project: Proyecto;
  view: AppView;
  insights: ManagementInsights;
  onViewChange: (view: AppView) => void;
  onOpenMentat: () => void;
  children: ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMmgProject = project.id === "mmg-lb-tsf1";
  const viewItems = [...managementItems, { view: "analista" as const, label: "Analista", icon: "fact_check" }];
  const counts: Partial<Record<AppView, string>> = {
    avance: insights.gapPct === null ? "NA" : `${insights.gapPct > 0 ? "+" : ""}${Math.round(insights.gapPct * 100)} pts`,
    warnings: insights.warningDatesAvailable ? String(insights.overdueCount) : "—",
    documentos: String(insights.pendingDocuments)
  };
  const viewLabel = viewItems.find((item) => item.view === view)?.label ?? "Analista";

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const onKeyDown = (event: KeyboardEvent) => event.key === "Escape" && setMobileOpen(false);
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  function navigate(nextView: AppView) {
    onViewChange(nextView);
    setMobileOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="nava-app">
      <TopBar project={project} view={view} viewLabel={viewLabel} onOpenMenu={() => setMobileOpen(true)} onOpenMentat={onOpenMentat} />
      <div className="nava-layout">
        <button className={`nava-scrim${mobileOpen ? " is-visible" : ""}`} type="button" aria-label="Cerrar menú" onClick={() => setMobileOpen(false)} />
        <aside className={`nava-sidebar${mobileOpen ? " is-open" : ""}`} aria-label="Navegación principal">
          <a className={`nava-sidebar__brand${isMmgProject ? " nava-sidebar__brand--client" : ""}`} href="./" aria-label={`GISTM Tracker ${isMmgProject ? "MMG" : "Nava"}, inicio`}>
            <img src={`${import.meta.env.BASE_URL}${isMmgProject ? "mmg-las-bambas-logo.jpeg" : "nava-logo.png"}`} alt={isMmgProject ? "MMG, We mine for progress" : "Nava"} />
            <span>GISTM Tracker</span>
          </a>
          <div className="nava-sidebar__project"><ProjectSelector /></div>
          <p className="nava-sidebar__section">Gerencia <span>Lectura</span></p>
          <nav className="nava-sidebar__nav">
            {managementItems.map((item) => (
              <button key={item.view} type="button" title={item.label} aria-current={view === item.view ? "page" : undefined} className={view === item.view ? "is-active" : ""} onClick={() => navigate(item.view)}>
                <MaterialIcon name={item.icon} />
                <span>{item.label}</span>
                {counts[item.view] && <b className={item.view === "warnings" && insights.overdueCount > 0 ? "is-risk" : ""}>{counts[item.view]}</b>}
              </button>
            ))}
          </nav>
          <p className="nava-sidebar__section nava-sidebar__section--work">Trabajo <span>Edición</span></p>
          <nav className="nava-sidebar__nav">
            <button type="button" title="Analista" aria-current={view === "analista" ? "page" : undefined} className={view === "analista" ? "is-active" : ""} onClick={() => navigate("analista")}>
              <MaterialIcon name="fact_check" />
              <span>Analista</span>
            </button>
          </nav>
          <div className="nava-sidebar__footer">
            <button type="button" onClick={onOpenMentat} title="Preguntar a Mentat">
              <MaterialIcon name="forum" /><span>Preguntar a Mentat</span>
            </button>
          </div>
        </aside>
        <main className="nava-main">
          <div className="nava-page">{children}</div>
        </main>
      </div>
    </div>
  );
}
