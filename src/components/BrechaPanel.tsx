import { useEffect, useState } from "react";
import { formatPct, getSemaphore } from "../lib/semaphore";
import { useProjectStore } from "../store/useProjectStore";
import type { Brecha, BrechaKey, Cumplimiento, PlanAccion, Proyecto } from "../types";
import { DataNotice, MaterialIcon, StatusBadge } from "./ui/primitives";

const planOptions: Array<PlanAccion | ""> = ["", "Cumple", "Cumple con compromiso", "Cumple con plan", "Actualizar", "Modificar", "Recopilar/Elaborar", "No cumple", "NA"];
const pctOptions: Array<Cumplimiento> = [0, 0.25, 0.5, 0.75, 1, "NA"];
const openPlans = new Set<PlanAccion>(["Actualizar", "Modificar", "Recopilar/Elaborar", "No cumple", "Cumple con compromiso", "Cumple con plan"]);

export function BrechaPanel({ project, brechaKey, variant = "drawer", onClose }: {
  project: Proyecto;
  brechaKey: BrechaKey;
  variant?: "drawer" | "analyst";
  onClose?: () => void;
}) {
  const { selectBrecha, updateBrecha } = useProjectStore();
  const brecha = project.brechas.find((item) => item && item.evidenciaId === brechaKey.evidenciaId && item.criterio === brechaKey.criterio);
  const evidencia = project.evidencias.find((item) => item && item.id === brechaKey.evidenciaId);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const pct = brecha && typeof brecha.cumplimiento === "number" ? brecha.cumplimiento : null;
  const semaforo = getSemaphore(pct);

  useEffect(() => {
    if (variant !== "analyst") return undefined;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") close(); };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [variant, onClose, selectBrecha]);

  if (!brecha || !evidencia) return null;

  function close() {
    if (onClose) onClose();
    else selectBrecha(null);
  }

  function update(patch: Partial<Brecha>) {
    if (!brecha) return;
    updateBrecha(project.id, brecha.evidenciaId, brecha.criterio, patch);
    setSavedAt(new Intl.DateTimeFormat("es-CL", { hour: "2-digit", minute: "2-digit" }).format(new Date()));
  }

  return <>
    {variant === "analyst" && <button className="nava-ficha-scrim" type="button" aria-label="Cerrar ficha" onClick={close} />}
    <aside className={`nava-brecha-panel${variant === "analyst" ? " nava-brecha-panel--analyst" : ""}`} aria-label="Ficha de brecha">
      <header className="nava-ficha-header"><div><p className="nava-eyebrow">Ficha brecha{brecha.excelRow ? ` · Fila Excel ${brecha.excelRow}` : ""}</p><h2>{brecha.criterio} · {evidencia.descripcion}</h2></div><button className="nava-icon-button nava-ficha-close" type="button" onClick={close} aria-label="Cerrar ficha"><MaterialIcon name="close" /></button></header>
      <div className="nava-ficha-scroll">
        <div className="nava-ficha-score" style={{ backgroundColor: semaforo.bg, color: semaforo.fg }}><StatusBadge value={pct} /><strong>{formatPct(pct)}</strong><span>{brecha.plan ?? "Sin asignar"}</span></div>
        <div className="nava-ficha-fields">
          <label className="nava-field"><span>Criterio</span><input className="nava-field--readonly nava-mono" value={brecha.criterio} readOnly /></label>
          <label className="nava-field"><span>Evidencia asociada</span><input className="nava-field--readonly" value={`E${String(evidencia.id).padStart(2, "0")} · ${evidencia.tipo}`} readOnly /></label>
          <label className="nava-field nava-field--full"><span>Documento/evidencia solicitada</span><textarea rows={2} value={brecha.documento ?? evidencia.descripcion} onChange={(event) => update({ documento: event.target.value })} /></label>
          <label className="nava-field nava-field--full"><span>Nombre del documento recibido (MMG-LB)</span><textarea rows={2} value={brecha.documentoRecibido ?? ""} onChange={(event) => update({ documentoRecibido: event.target.value })} /></label>
          <label className="nava-field nava-field--full"><span>Filtro N°1 · Semana 19/10/26</span><textarea rows={3} value={brecha.filtro ?? ""} onChange={(event) => update({ filtro: event.target.value })} /></label>
          <label className="nava-field"><span>Cumplimiento</span><select value={String(brecha.cumplimiento)} onChange={(event) => { const nextValue = event.target.value === "NA" ? "NA" : Number(event.target.value); update({ cumplimiento: nextValue, plan: nextValue === "NA" ? "NA" : brecha.plan }); }}>{pctOptions.map((item) => <option key={String(item)} value={String(item)}>{item === "NA" ? "NA" : `${Math.round(item * 100)}%`}</option>)}</select></label>
          <label className="nava-field"><span>Plan</span><select value={brecha.plan ?? ""} onChange={(event) => update({ plan: event.target.value ? event.target.value as PlanAccion : null, cumplimiento: event.target.value === "NA" ? "NA" : brecha.cumplimiento })}>{planOptions.map((item) => <option key={item || "empty"} value={item}>{item || "Sin asignar"}</option>)}</select></label>
          <label className="nava-field"><span>Autor</span><input value={brecha.autor ?? ""} onChange={(event) => update({ autor: event.target.value })} /></label>
          <label className="nava-field"><span>Revisor</span><input value={brecha.revisor ?? ""} onChange={(event) => update({ revisor: event.target.value })} /></label>
          <label className="nava-field"><span>Responsable brecha</span><input value={brecha.responsableBrecha ?? ""} placeholder="Sin responsable" onChange={(event) => update({ responsableBrecha: event.target.value })} /></label>
          <label className="nava-field"><span>Fecha compromiso</span><input type="date" value={brecha.fechaCompromiso ?? ""} onChange={(event) => update({ fechaCompromiso: event.target.value })} /></label>
          {brecha.plan && openPlans.has(brecha.plan) && !brecha.fechaCompromiso && <div className="nava-field-notice"><DataNotice>{project.fechasCompromisoSinteticas === false ? "La planilla no incluye fecha de compromiso. Al registrar una fecha real, esta brecha podrá aparecer en Warnings." : "Plan abierto sin fecha de compromiso. Warnings mostrará una fecha de ejemplo hasta que registres una fecha real."}</DataNotice></div>}
          <label className="nava-field nava-field--full"><span>Brecha / plan de acción para cumplimiento</span><textarea rows={4} value={brecha.brechaPlan ?? ""} onChange={(event) => update({ brechaPlan: event.target.value })} /></label>
          <label className="nava-field nava-field--full"><span>Referencia documental / respaldo interno</span><textarea rows={3} value={brecha.referenciaDocumental ?? ""} onChange={(event) => update({ referenciaDocumental: event.target.value })} /></label>
        </div>
      </div>
      <footer className="nava-ficha-footer"><span><MaterialIcon name="edit_note" />{savedAt ? `Guardado localmente · ${savedAt}` : "Los cambios se guardan al editar"}</span><button type="button" className="nava-button" onClick={close}>Listo</button></footer>
    </aside>
  </>;
}
