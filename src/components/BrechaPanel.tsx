import { formatPct, getSemaphore } from "../lib/semaphore";
import { useProjectStore } from "../store/useProjectStore";
import { BrechaKey, Cumplimiento, PlanAccion, Proyecto } from "../types";

const planOptions: Array<PlanAccion | ""> = [
  "",
  "Cumple",
  "Cumple con compromiso",
  "Cumple con plan",
  "Actualizar",
  "Modificar",
  "Recopilar/Elaborar",
  "No cumple",
  "NA"
];
const pctOptions: Array<Cumplimiento> = [0, 0.25, 0.5, 0.75, 1, "NA"];

export function BrechaPanel({ project, brechaKey }: { project: Proyecto; brechaKey: BrechaKey }) {
  const { selectBrecha, updateBrecha } = useProjectStore();
  const brecha = project.brechas.find((item) => item && item.evidenciaId === brechaKey.evidenciaId && item.criterio === brechaKey.criterio);
  const evidencia = project.evidencias.find((item) => item && item.id === brechaKey.evidenciaId);

  if (!brecha || !evidencia) return null;

  const pct = typeof brecha.cumplimiento === "number" ? brecha.cumplimiento : null;
  const semaforo = getSemaphore(pct);

  return (
    <aside className="drawer" aria-label="Ficha de brecha">
      <div className="drawer-header">
        <div>
          <p className="eyebrow">Ficha brecha</p>
          <h2>{brecha.criterio} · {evidencia.descripcion}</h2>
        </div>
        <button className="icon-action" onClick={() => selectBrecha(null)} aria-label="Cerrar ficha">
          ×
        </button>
      </div>

      <div className="drawer-score">
        <span className={`status-badge ${semaforo.className}`}>{semaforo.label}</span>
        <strong>{formatPct(pct)}</strong>
        <small>{brecha.excelRow ? `Fila Excel ${brecha.excelRow}` : "Fila editable de brechas identificadas"}</small>
      </div>

      <div className="drawer-fields">
        <label className="field-label">
          Criterio
          <input value={brecha.criterio} readOnly />
        </label>
        <label className="field-label">
          Evidencia asociada
          <input value={`${String(evidencia.id).padStart(2, "0")} · ${evidencia.tipo}`} readOnly />
        </label>
        <label className="field-label">
          Cumplimiento
          <select
            value={String(brecha.cumplimiento)}
            onChange={(event) => {
              const nextValue = event.target.value === "NA" ? "NA" : Number(event.target.value);
              updateBrecha(project.id, brecha.evidenciaId, brecha.criterio, {
                cumplimiento: nextValue,
                plan: nextValue === "NA" ? "NA" : brecha.plan
              });
            }}
          >
            {pctOptions.map((item) => (
              <option key={String(item)} value={String(item)}>
                {item === "NA" ? "NA" : `${Math.round(item * 100)}%`}
              </option>
            ))}
          </select>
        </label>
        <label className="field-label">
          Plan
          <select
            value={brecha.plan ?? ""}
            onChange={(event) =>
              updateBrecha(project.id, brecha.evidenciaId, brecha.criterio, {
                plan: event.target.value ? (event.target.value as PlanAccion) : null,
                cumplimiento: event.target.value === "NA" ? "NA" : brecha.cumplimiento
              })
            }
          >
            {planOptions.map((item) => (
              <option key={item || "empty"} value={item}>
                {item || "Sin asignar"}
              </option>
            ))}
          </select>
        </label>
        <label className="field-label">
          Responsable brecha
          <input
            value={brecha.responsableBrecha ?? ""}
            onChange={(event) => updateBrecha(project.id, brecha.evidenciaId, brecha.criterio, { responsableBrecha: event.target.value })}
          />
        </label>
        <label className="field-label">
          Fecha compromiso
          <input
            type="date"
            value={brecha.fechaCompromiso ?? ""}
            onChange={(event) => updateBrecha(project.id, brecha.evidenciaId, brecha.criterio, { fechaCompromiso: event.target.value })}
          />
        </label>
        <label className="field-label full">
          Brecha/plan de acción para cumplimiento
          <textarea
            rows={4}
            value={brecha.brechaPlan ?? ""}
            onChange={(event) => updateBrecha(project.id, brecha.evidenciaId, brecha.criterio, { brechaPlan: event.target.value })}
          />
        </label>
        <label className="field-label full">
          Referencia documental / respaldo interno
          <textarea
            rows={3}
            value={brecha.referenciaDocumental ?? ""}
            onChange={(event) => updateBrecha(project.id, brecha.evidenciaId, brecha.criterio, { referenciaDocumental: event.target.value })}
          />
        </label>
      </div>
    </aside>
  );
}
