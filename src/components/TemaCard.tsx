import { TemaResumen } from "../types";
import { formatPct, getSemaphore } from "../lib/semaphore";

export function TemaCard({ tema }: { tema: TemaResumen }) {
  const semaforo = getSemaphore(tema.pctPromedio);
  const topCriteria = [...tema.criterios].sort((a, b) => (a.pct ?? -1) - (b.pct ?? -1)).slice(0, 5);

  return (
    <article className="tema-card">
      <div className="tema-card-top">
        <div>
          <h3>{tema.nombre}</h3>
          <p>{tema.descripcion}</p>
        </div>
        <span className={`status-badge ${semaforo.className}`}>{formatPct(tema.pctPromedio)}</span>
      </div>
      <div className="bar-track">
        <span style={{ width: `${tema.pctPromedio === null ? 0 : Math.round(tema.pctPromedio * 100)}%` }} />
      </div>
      <div className="tema-meta">
        <span>{tema.criterios.length} criterios</span>
        <span>{tema.evidenciasCount} evidencias</span>
        <span>{tema.brechasAbiertas} brechas</span>
      </div>
      <div className="criterion-chips">
        {topCriteria.map((criterio) => (
          <span key={criterio.criterio}>
            {criterio.criterio} · {formatPct(criterio.pct)}
          </span>
        ))}
      </div>
    </article>
  );
}
