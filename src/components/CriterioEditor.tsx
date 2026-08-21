import { Brecha, Cumplimiento, PlanAccion } from "../types";
import { useProjectStore } from "../store/useProjectStore";
import { formatPct, getSemaphore } from "../lib/semaphore";

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

export function CriterioEditor({ projectId, brecha }: { projectId: string; brecha: Brecha }) {
  const updateBrecha = useProjectStore((state) => state.updateBrecha);
  const numericPct = typeof brecha.cumplimiento === "number" ? brecha.cumplimiento : null;
  const semaforo = getSemaphore(numericPct);

  return (
    <article className="criterion-card">
      <div className="criterion-top">
        <div>
          <p className="eyebrow">Criterio</p>
          <strong>{brecha.criterio}</strong>
        </div>
        <span className={`status-badge ${semaforo.className}`}>{formatPct(numericPct)}</span>
      </div>
      <div className="criterion-grid">
        <label className="field-label">
          Cumplimiento
          <select
            value={String(brecha.cumplimiento)}
            onChange={(event) => {
              const nextValue = event.target.value === "NA" ? "NA" : Number(event.target.value);
              updateBrecha(projectId, brecha.evidenciaId, brecha.criterio, {
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
              updateBrecha(projectId, brecha.evidenciaId, brecha.criterio, {
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
            onChange={(event) => updateBrecha(projectId, brecha.evidenciaId, brecha.criterio, { responsableBrecha: event.target.value })}
          />
        </label>
        <label className="field-label">
          Fecha compromiso
          <input
            type="date"
            value={brecha.fechaCompromiso ?? ""}
            onChange={(event) => updateBrecha(projectId, brecha.evidenciaId, brecha.criterio, { fechaCompromiso: event.target.value })}
          />
        </label>
      </div>
      <label className="field-label">
        Referencia del criterio
        <input
          value={brecha.referenciaDocumental ?? ""}
          onChange={(event) => updateBrecha(projectId, brecha.evidenciaId, brecha.criterio, { referenciaDocumental: event.target.value })}
        />
      </label>
    </article>
  );
}
