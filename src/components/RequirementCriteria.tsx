import { useState } from "react";
import { averageCumplimiento } from "../lib/aggregations";
import { formatPct } from "../lib/semaphore";
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
  const codes = Array.from(new Set(detail.brechas.map((brecha) => brecha.criterio)))
    .sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
  const activeCode = selectedBrecha?.criterio ?? expandedCode;

  return <div className="gistm-criteria-list" aria-label={`Criterios NAVA del requisito ${detail.id}`}>
    {codes.map((code) => {
      const brechas = detail.brechas.filter((brecha) => brecha.criterio === code);
      const expanded = activeCode === code;
      const criterionPct = averageCumplimiento(brechas.map((brecha) => brecha.cumplimiento));
      const evidenceCount = new Set(brechas.map((brecha) => brecha.evidenciaId)).size;
      return <section className="gistm-criterion" key={code}>
        <button type="button" className="gistm-criterion__trigger" aria-expanded={expanded} onClick={() => { onClear(); setExpandedCode(expanded ? null : code); }}>
          <MaterialIcon name={expanded ? "expand_more" : "chevron_right"} /><span><strong>Criterio NAVA {code}</strong><small>{evidenceCount} evidencias asociadas</small></span><StatusBadge value={criterionPct} label={formatPct(criterionPct)} />
        </button>
        {expanded && <div className="nava-associated-brechas">{brechas.map((brecha) => {
          const evidence = project.evidencias.find((item) => item.id === brecha.evidenciaId);
          if (!evidence) return null;
          const selected = selectedBrecha?.evidenciaId === brecha.evidenciaId && selectedBrecha.criterio === code;
          const pct = typeof brecha.cumplimiento === "number" ? brecha.cumplimiento : null;
          return <button className={`nava-associated-row${selected ? " is-selected" : ""}`} type="button" key={`${brecha.evidenciaId}-${code}`} onClick={() => { setExpandedCode(code); onOpen(brecha.evidenciaId, code); }}>
            <span className="nava-associated-row__icon"><MaterialIcon name="description" /></span><span className="nava-associated-row__copy"><strong>{evidence.descripcion}</strong><small>E{String(evidence.id).padStart(2, "0")} · {evidence.tipo} · {brecha.plan ?? "Sin plan"}</small></span><StatusBadge value={pct} label={formatPct(pct)} /><MaterialIcon name="chevron_right" />
          </button>;
        })}</div>}
      </section>;
    })}
  </div>;
}
