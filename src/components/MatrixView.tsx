import { useMemo, useState } from "react";
import { getDominantThemeForEvidence, getEvidencePct, getTemaResumen } from "../lib/aggregations";
import { Proyecto, TipoEvidencia } from "../types";
import { useProjectStore } from "../store/useProjectStore";
import { EvidenceRow } from "./EvidenceRow";
import { formatPct, getSemaphore } from "../lib/semaphore";

const typeOptions: Array<TipoEvidencia | "Todas"> = ["Todas", "ADM/RRHH", "GOB", "POL", "S&A", "TEC", "TKB"];

export function MatrixView({ project }: { project: Proyecto }) {
  const { temas, collapsedThemes, toggleTheme } = useProjectStore();
  const [query, setQuery] = useState("");
  const [tipo, setTipo] = useState<TipoEvidencia | "Todas">("Todas");
  const resumen = useMemo(() => getTemaResumen(temas, project.evidencias, project.brechas), [temas, project]);

  const grouped = resumen.map((tema) => {
    const evidencias = project.evidencias
      .filter((evidencia) => getDominantThemeForEvidence(evidencia.id, project.brechas, temas).id === tema.id)
      .filter((evidencia) => tipo === "Todas" || evidencia.tipo === tipo)
      .filter((evidencia) => {
        const text = `${evidencia.id} ${evidencia.descripcion} ${evidencia.tipo} ${evidencia.responsable}`.toLowerCase();
        return text.includes(query.trim().toLowerCase());
      });
    return { tema, evidencias };
  });

  return (
    <section className="workspace-grid">
      <aside className="side-panel">
        <p className="eyebrow">Filtros</p>
        <label className="field-label">
          Buscar evidencia
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Documento, responsable, ID..." />
        </label>
        <label className="field-label">
          Tipo de evidencia
          <select value={tipo} onChange={(event) => setTipo(event.target.value as TipoEvidencia | "Todas")}>
            {typeOptions.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <div className="legend">
          <span className="status-badge badge-green">75-100</span>
          <span className="status-badge badge-yellow">50-74</span>
          <span className="status-badge badge-orange">25-49</span>
          <span className="status-badge badge-red">0-24</span>
          <span className="status-badge badge-gray">NA</span>
        </div>
      </aside>

      <div className="matrix-panel">
        {grouped.map(({ tema, evidencias }) => {
          const semaforo = getSemaphore(tema.pctPromedio);
          const collapsed = collapsedThemes.includes(tema.id);
          return (
            <section className="theme-section" key={tema.id}>
              <button className="theme-header" onClick={() => toggleTheme(tema.id)}>
                <span>{collapsed ? "▸" : "▾"}</span>
                <div>
                  <strong>{tema.nombre}</strong>
                  <small>{evidencias.length} evidencias visibles · {tema.criterios.length} requisitos</small>
                </div>
                <span className={`status-badge ${semaforo.className}`}>{formatPct(tema.pctPromedio)}</span>
              </button>
              {!collapsed && (
                <div className="evidence-table">
                  {evidencias.map((evidencia) => (
                    <EvidenceRow
                      key={evidencia.id}
                      evidencia={evidencia}
                      pct={getEvidencePct(evidencia.id, project.brechas)}
                      criteriaCount={project.brechas.filter((brecha) => brecha.evidenciaId === evidencia.id).length}
                    />
                  ))}
                  {evidencias.length === 0 && <div className="empty-state">No hay evidencias para este filtro.</div>}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </section>
  );
}
