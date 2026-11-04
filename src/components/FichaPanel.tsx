import { useMemo } from "react";
import { getEvidencePct } from "../lib/aggregations";
import { formatPct, getSemaphore } from "../lib/semaphore";
import { useProjectStore } from "../store/useProjectStore";
import { Proyecto } from "../types";
import { CriterioEditor } from "./CriterioEditor";

export function FichaPanel({ project, evidenceId }: { project: Proyecto; evidenceId: number }) {
  const { selectEvidence, updateEvidence } = useProjectStore();
  const evidencia = project.evidencias.find((item) => item.id === evidenceId);
  const brechas = useMemo(() => project.brechas.filter((item) => item.evidenciaId === evidenceId), [project.brechas, evidenceId]);

  if (!evidencia) return null;
  const pct = getEvidencePct(evidenceId, project.brechas);
  const semaforo = getSemaphore(pct);

  return (
    <aside className="drawer" aria-label="Ficha de evidencia">
      <div className="drawer-header">
        <div>
          <p className="eyebrow">Ficha evidencia {String(evidencia.id).padStart(2, "0")}</p>
          <h2>{evidencia.descripcion}</h2>
        </div>
        <button className="icon-action" onClick={() => selectEvidence(null)} aria-label="Cerrar ficha">
          ×
        </button>
      </div>

      <div className="drawer-score">
        <span className={`status-badge ${semaforo.className}`}>{semaforo.label}</span>
        <strong>{formatPct(pct)}</strong>
        <small>{brechas.length} requisitos asociados</small>
      </div>

      <div className="drawer-fields">
        <label className="field-label">
          Responsable evidencia
          <input
            value={evidencia.responsable ?? ""}
            onChange={(event) => updateEvidence(project.id, evidenceId, { responsable: event.target.value })}
          />
        </label>
        <label className="field-label">
          Disponible
          <select
            value={evidencia.disponible ?? ""}
            onChange={(event) => updateEvidence(project.id, evidenceId, { disponible: event.target.value as typeof evidencia.disponible })}
          >
            <option value="">Sin informar</option>
            <option value="Si">Si</option>
            <option value="No">No</option>
            <option value="NA">NA</option>
          </select>
        </label>
        <label className="field-label full">
          Referencia documental
          <textarea
            rows={2}
            value={evidencia.referenciaDocumental ?? ""}
            onChange={(event) => updateEvidence(project.id, evidenceId, { referenciaDocumental: event.target.value })}
          />
        </label>
      </div>

      <div className="criteria-list">
        {brechas.map((brecha) => (
          <CriterioEditor key={`${brecha.evidenciaId}-${brecha.criterio}`} projectId={project.id} brecha={brecha} />
        ))}
      </div>
    </aside>
  );
}
