import { useMemo } from "react";
import { getProjectPct, getTemaResumen } from "../lib/aggregations";
import { formatPct, getSemaphore } from "../lib/semaphore";
import { useProjectStore } from "../store/useProjectStore";
import { Proyecto } from "../types";
import { TemaCard } from "./TemaCard";

export function ClientDashboard({ project }: { project: Proyecto }) {
  const temas = useProjectStore((state) => state.temas);
  const resumen = useMemo(() => getTemaResumen(temas, project.evidencias, project.brechas), [temas, project]);
  const total = getProjectPct(project.brechas);
  const semaforo = getSemaphore(total);
  const criticalThemes = resumen.filter((tema) => (tema.pctPromedio ?? 1) < 0.5).length;

  return (
    <section className="client-dashboard">
      <div className="client-hero">
        <div>
          <p className="eyebrow">Vista cliente · solo lectura</p>
          <h2>Estado de cumplimiento GISTM</h2>
          <p>Resumen ejecutivo por tema, sin responsables internos ni edicion de matriz.</p>
        </div>
        <div className="client-kpis">
          <div>
            <span className={`status-badge ${semaforo.className}`}>{semaforo.label}</span>
            <strong>{formatPct(total)}</strong>
            <small>Cumplimiento global</small>
          </div>
          <div>
            <strong>{criticalThemes}</strong>
            <small>Temas bajo 50%</small>
          </div>
          <div>
            <strong>{project.evidencias.length}</strong>
            <small>Evidencias evaluadas</small>
          </div>
        </div>
      </div>
      <div className="tema-grid">
        {resumen.map((tema) => (
          <TemaCard key={tema.id} tema={tema} />
        ))}
      </div>
    </section>
  );
}
