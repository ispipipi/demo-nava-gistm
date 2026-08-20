import { useProjectStore } from "../store/useProjectStore";
import { Evidencia } from "../types";
import { formatPct, getSemaphore } from "../lib/semaphore";

export function EvidenceRow({ evidencia, pct, criteriaCount }: { evidencia: Evidencia; pct: number | null; criteriaCount: number }) {
  const selectEvidence = useProjectStore((state) => state.selectEvidence);
  const semaforo = getSemaphore(pct);

  return (
    <button className="evidence-row" onClick={() => selectEvidence(evidencia.id)}>
      <span className="evidence-id">{String(evidencia.id).padStart(2, "0")}</span>
      <span className="evidence-main">
        <strong>{evidencia.descripcion}</strong>
        <small>{evidencia.tipo} · {criteriaCount} criterios · responsable: {evidencia.responsable || "Sin asignar"}</small>
      </span>
      <span className="progress-cell">
        <span className={`status-badge ${semaforo.className}`}>{semaforo.label}</span>
        <strong>{formatPct(pct)}</strong>
      </span>
    </button>
  );
}
