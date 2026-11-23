import { useState } from "react";
import { averageCumplimiento, getCriterionDetail } from "../lib/aggregations";
import { formatPct } from "../lib/semaphore";
import { useProjectStore } from "../store/useProjectStore";
import type { BrechaKey, CriterioDetalleResumen, Proyecto } from "../types";
import { MaterialIcon, StatusBadge } from "./ui/primitives";

export function RequirementCriteria({ detail, project, selectedBrecha, onOpen, onClear }: {
  detail: CriterioDetalleResumen;
  project: Proyecto;
  selectedBrecha: BrechaKey | null;
  onOpen: (evidenciaId: number, criterio: string) => void;
  onClear: () => void;
}) {
  const [expandedCode, setExpandedCode] = useState<string | null>(selectedBrecha?.criterio ?? null);
  const [addingToCode, setAddingToCode] = useState<string | null>(null);
  const [newEvidenceId, setNewEvidenceId] = useState("");
  const addBrecha = useProjectStore((state) => state.addBrecha);
  const removeBrecha = useProjectStore((state) => state.removeBrecha);
  const clearSelectedBrecha = useProjectStore((state) => state.selectBrecha);
  const codes = Array.from(new Set([
    ...detail.brechas.map((brecha) => brecha.criterio),
    ...(project.criteriosNava ?? []).filter((criterion) => getCriterionDetail(criterion) === detail.id)
  ]))
    .sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
  const activeCode = selectedBrecha?.criterio ?? expandedCode;

  return <div className="gistm-criteria-list" aria-label={`Criterios NAVA del requisito ${detail.id}`}>
    {codes.map((code) => {
      const brechas = detail.brechas.filter((brecha) => brecha.criterio === code);
      const expanded = activeCode === code;
      const criterionPct = averageCumplimiento(brechas.map((brecha) => brecha.cumplimiento));
      const evidenceCount = new Set(brechas.map((brecha) => brecha.evidenciaId)).size;
      const evaluatedCount = brechas.filter((brecha) => brecha.cumplimiento !== null && brecha.cumplimiento !== undefined).length;
      const unassessedCount = brechas.filter((brecha) => brecha.cumplimiento === null || brecha.cumplimiento === undefined).length;
      const openCount = brechas.filter((brecha) => brecha.plan && brecha.plan !== "Cumple" && brecha.plan !== "NA").length;
      const associatedEvidenceIds = new Set(brechas.map((brecha) => brecha.evidenciaId));
      const availableEvidence = project.evidencias.filter((evidence) => !associatedEvidenceIds.has(evidence.id));
      return <section className="gistm-criterion" key={code}>
        <button type="button" className="gistm-criterion__trigger" aria-expanded={expanded} onClick={() => { onClear(); setExpandedCode(expanded ? null : code); }}>
          <MaterialIcon name={expanded ? "expand_more" : "chevron_right"} /><span><strong>Criterio NAVA {code}</strong><small>{evidenceCount} evidencias asociadas</small></span><StatusBadge value={criterionPct} label={formatPct(criterionPct)} />
        </button>
        {expanded && <div className="nava-associated-brechas">
          <div className="gistm-criterion-summary" aria-label={`Resumen del criterio NAVA ${code}`}>
            <div className="gistm-criterion-summary__heading"><div><p className="nava-eyebrow">Ficha consolidada</p><h3>Criterio NAVA {code}</h3></div><StatusBadge value={criterionPct} label={formatPct(criterionPct)} /></div>
            <div className="gistm-criterion-summary__metrics"><span><strong>{evidenceCount}</strong><small>Evidencias asociadas</small></span><span><strong>{formatPct(criterionPct)}</strong><small>Promedio actual</small></span><span><strong>{evaluatedCount}</strong><small>Evaluadas</small></span><span><strong>{unassessedCount}</strong><small>Sin evaluar</small></span><span><strong>{openCount}</strong><small>Planes abiertos</small></span></div>
            <p>El resumen reúne las relaciones de este criterio. Los campos editables y el seguimiento pertenecen a cada ficha de evidencia.</p>
          </div>
          {brechas.map((brecha) => {
          const evidence = project.evidencias.find((item) => item.id === brecha.evidenciaId);
          if (!evidence) return null;
          const evidenceId = evidence.id;
          const evidenceName = evidence.descripcion;
          const selected = selectedBrecha?.evidenciaId === brecha.evidenciaId && selectedBrecha.criterio === code;
          const pct = typeof brecha.cumplimiento === "number" ? brecha.cumplimiento : null;
          function removeAssociation() {
            const confirmed = window.confirm(`¿Quitar E${String(evidenceId).padStart(2, "0")} de ${code}? Se eliminarán también los datos de cumplimiento y seguimiento de esta relación.`);
            if (!confirmed) return;
            removeBrecha(project.id, evidenceId, code);
            if (selected) clearSelectedBrecha(null);
          }
          const followupCount = brecha.seguimientos?.length ?? 0;
          const relationMeta = [
            `E${String(evidenceId).padStart(2, "0")}`,
            evidence.tipo,
            brecha.plan ?? "Sin plan",
            brecha.responsableBrecha?.trim() || "Sin responsable de brecha",
            brecha.fechaCompromiso ? `Compromiso ${brecha.fechaCompromiso}` : "Sin fecha compromiso",
            `${followupCount} ${followupCount === 1 ? "nota" : "notas"}`
          ].join(" · ");
          return <div className="gistm-associated-item" key={`${brecha.evidenciaId}-${code}`}>
            <button className={`nava-associated-row${selected ? " is-selected" : ""}`} type="button" onClick={() => { setExpandedCode(code); onOpen(brecha.evidenciaId, code); }}>
              <span className="nava-associated-row__icon"><MaterialIcon name="description" /></span><span className="nava-associated-row__copy"><strong>{evidenceName}</strong><small>{relationMeta}</small></span><StatusBadge value={pct} label={brecha.cumplimiento === null ? "Sin evaluar" : formatPct(pct)} /><MaterialIcon name="chevron_right" />
            </button>
            <button type="button" className="gistm-association-remove" aria-label={`Quitar E${String(evidence.id).padStart(2, "0")} del criterio ${code}`} title="Quitar asociación" onClick={removeAssociation}><MaterialIcon name="link_off" /></button>
          </div>;
          })}
        {addingToCode === code ? <div className="gistm-associate-form"><label><span>Documento que quieres asociar</span><select aria-label={`Documento para asociar al criterio ${code}`} value={newEvidenceId} onChange={(event) => setNewEvidenceId(event.target.value)}><option value="">Selecciona una evidencia</option>{availableEvidence.map((evidence) => <option key={evidence.id} value={evidence.id}>E{String(evidence.id).padStart(2, "0")} · {evidence.descripcion}</option>)}</select></label><div><button type="button" className="nava-button" disabled={!newEvidenceId} onClick={() => { const evidenceId = Number(newEvidenceId); addBrecha(project.id, evidenceId, code); setExpandedCode(code); setAddingToCode(null); setNewEvidenceId(""); onOpen(evidenceId, code); }}>Asociar y completar ficha</button><button type="button" className="gistm-associate-cancel" onClick={() => { setAddingToCode(null); setNewEvidenceId(""); }}>Cancelar</button></div></div> : <button type="button" className="gistm-associate-trigger" disabled={availableEvidence.length === 0} onClick={() => { setAddingToCode(code); setNewEvidenceId(""); }}><MaterialIcon name="add_link" /> Asociar evidencia</button>}
        </div>}
      </section>;
    })}
  </div>;
}
