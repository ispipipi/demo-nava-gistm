import { useMemo } from "react";
import { getCriterionDetail, getCriterionGroupSummary, getCriterionRoot } from "../lib/aggregations";
import { getCriterionLabel } from "../lib/criterionLabels";
import { formatPct, getSemaphore } from "../lib/semaphore";
import { useProjectStore } from "../store/useProjectStore";
import type { BrechaKey, Proyecto } from "../types";
import { BrechaPanel } from "./BrechaPanel";
import { Breadcrumbs, EmptyState, MaterialIcon, StatusBadge } from "./ui/primitives";

export function CriteriaDashboard({ project, onOpenAnalyst }: {
  project: Proyecto;
  onOpenAnalyst: (criterion: string, subcriterion?: string | null, brecha?: BrechaKey) => void;
}) {
  const analystCriterion = useProjectStore((state) => state.analystCriterion);
  const analystSubcriterion = useProjectStore((state) => state.analystSubcriterion);
  const selectedBrecha = useProjectStore((state) => state.selectedBrecha);
  const setAnalystLocation = useProjectStore((state) => state.setAnalystLocation);
  const selectBrecha = useProjectStore((state) => state.selectBrecha);
  const groups = useMemo(() => getCriterionGroupSummary(project.evidencias, project.brechas), [project]);
  const activeGroup = groups.find((item) => item.id === analystCriterion) ?? null;
  const activeDetail = activeGroup?.detalles.find((item) => item.id === analystSubcriterion) ?? null;
  const activeBrecha = selectedBrecha ? project.brechas.find((item) => item && item.evidenciaId === selectedBrecha.evidenciaId && item.criterio === selectedBrecha.criterio) : null;
  const activeEvidence = activeBrecha ? project.evidencias.find((item) => item.id === activeBrecha.evidenciaId) : null;

  function selectGroup(groupId: string) {
    const group = groups.find((item) => item.id === groupId);
    if (!group) return;
    if (analystCriterion === groupId) {
      setAnalystLocation(null, null);
      selectBrecha(null);
      return;
    }
    const nextDetail = group.detalles[0]?.id ?? null;
    setAnalystLocation(groupId, nextDetail);
    selectBrecha(null);
  }

  function selectSubcriterion(subcriterion: string) {
    if (!activeGroup?.detalles.some((item) => item.id === subcriterion)) return;
    setAnalystLocation(activeGroup.id, subcriterion);
    selectBrecha(null);
  }

  function openBrecha(evidenciaId: number, criterio: string) {
    const root = getCriterionRoot(criterio);
    const detail = getCriterionDetail(criterio);
    onOpenAnalyst(root, detail, { evidenciaId, criterio });
  }

  return (
    <div className={`nava-view nava-analyst${activeDetail ? " has-detail" : ""}${selectedBrecha ? " has-brecha" : ""}`}>
      <div className="nava-analyst-heading">
        <div><p className="nava-eyebrow">Trabajo · Edición</p><h1>Revisión de brechas y fichas</h1><p>Criterio → subcriterio → brechas asociadas → ficha editable</p></div>
        <span className="nava-count-pill">{project.brechas.length} brechas</span>
      </div>
      <Breadcrumbs items={[
        { label: "Criterios 1–15", onClick: () => { setAnalystLocation(null, null); selectBrecha(null); } },
        ...(activeGroup ? [{ label: `C${activeGroup.id} ${getCriterionLabel(activeGroup.id)}`, onClick: () => { setAnalystLocation(activeGroup.id, null); selectBrecha(null); } }] : []),
        ...(activeDetail ? [{ label: activeDetail.id, onClick: () => selectBrecha(null) }] : []),
        ...(activeBrecha && activeEvidence ? [{ label: `E${String(activeEvidence.id).padStart(2, "0")}` }] : [])
      ]} />
      <div className="nava-analyst-grid">
        <aside className="nava-criteria-master" aria-label="Criterios GISTM 1 a 15">
          <div className="nava-analyst-panel-heading"><div><p className="nava-eyebrow">Matriz GISTM</p><h2>Criterios 1–15</h2></div><span>{groups.length}</span></div>
          <div className="nava-criteria-accordion">
            {groups.map((group) => {
              const expanded = activeGroup?.id === group.id;
              const status = getSemaphore(group.pctPromedio);
              return <section className={`nava-criteria-group${expanded ? " is-expanded" : ""}`} key={group.id}>
                <button type="button" className="nava-criteria-group__trigger" aria-expanded={expanded} onClick={() => selectGroup(group.id)}>
                  <MaterialIcon name={expanded ? "expand_more" : "chevron_right"} />
                  <span className="nava-criteria-group__copy"><span><b>C{group.id}</b><strong>{getCriterionLabel(group.id)}</strong></span><small>{group.detalles.length} subcriterios · {group.brechasAbiertas} abiertas</small></span>
                  <span className="nava-criteria-group__score" style={{ color: status.fg }}><MaterialIcon name={status.icon} />{formatPct(group.pctPromedio)}</span>
                </button>
                {expanded && <div className="nava-criteria-sublist">{group.detalles.map((detail) => <button key={detail.id} type="button" className={analystSubcriterion === detail.id ? "is-selected" : ""} aria-current={analystSubcriterion === detail.id ? "true" : undefined} onClick={() => selectSubcriterion(detail.id)}><span className="nava-mono">{detail.id}</span><span><strong>{detail.brechas.length} brechas</strong><small>{detail.evidencias.length} fichas</small></span><b>{formatPct(detail.pctPromedio)}</b></button>)}</div>}
              </section>;
            })}
          </div>
        </aside>

        <section className="nava-criteria-detail" aria-label="Brechas asociadas al subcriterio">
          {!activeGroup ? <EmptyState title="Elige un criterio" detail="Selecciona uno de los 15 criterios para revisar sus subcriterios y brechas." /> : !activeDetail ? <div className="nava-detail-intro"><p className="nava-eyebrow">Criterio {activeGroup.id}</p><h2>{getCriterionLabel(activeGroup.id)}</h2><p>Selecciona un subcriterio para ver exclusivamente sus brechas asociadas.</p><div className="nava-subcriterion-choices">{activeGroup.detalles.map((detail) => <button key={detail.id} type="button" onClick={() => selectSubcriterion(detail.id)}><span className="nava-mono">{detail.id}</span><strong>{detail.brechas.length} brechas</strong><MaterialIcon name="chevron_right" /></button>)}</div></div> : <>
            <div className="nava-detail-header"><button className="nava-mobile-back" type="button" onClick={() => { setAnalystLocation(activeGroup.id, null); selectBrecha(null); }}><MaterialIcon name="arrow_back" />Criterios</button><div><p className="nava-eyebrow">Criterio {activeGroup.id} · {getCriterionLabel(activeGroup.id)}</p><h2>Brechas asociadas</h2><p>Subcriterio <strong className="nava-mono">{activeDetail.id}</strong> · sólo registros vinculados a este código</p></div><span className="nava-count-pill">{activeDetail.brechas.length} fichas</span></div>
            <div className="nava-subcriterion-tabs" role="group" aria-label={`Subcriterios del criterio ${activeGroup.id}`}>{activeGroup.detalles.map((detail) => <button key={detail.id} type="button" className={analystSubcriterion === detail.id ? "is-active" : ""} aria-pressed={analystSubcriterion === detail.id} onClick={() => selectSubcriterion(detail.id)}><span className="nava-mono">{detail.id}</span><small>{formatPct(detail.pctPromedio)}</small></button>)}</div>
            <div className="nava-associated-brechas">{activeDetail.brechas.length ? activeDetail.brechas.map((brecha) => {
              const evidence = project.evidencias.find((item) => item.id === brecha.evidenciaId);
              if (!evidence) return null;
              const selected = selectedBrecha?.evidenciaId === brecha.evidenciaId && selectedBrecha.criterio === brecha.criterio;
              const pct = typeof brecha.cumplimiento === "number" ? brecha.cumplimiento : null;
              return <button className={`nava-associated-row${selected ? " is-selected" : ""}`} type="button" key={`${brecha.evidenciaId}-${brecha.criterio}`} onClick={() => openBrecha(brecha.evidenciaId, brecha.criterio)}><span className="nava-associated-row__icon"><MaterialIcon name="description" /></span><span className="nava-associated-row__copy"><strong>{brecha.criterio} · {evidence.descripcion}</strong><small>E{String(evidence.id).padStart(2, "0")} · {evidence.tipo} · {brecha.plan ?? "Sin plan"}</small></span><StatusBadge value={pct} /><MaterialIcon name="chevron_right" /></button>;
            }) : <EmptyState title="Sin brechas asociadas" detail={`No hay registros vinculados al subcriterio ${activeDetail.id}.`} positive />}</div>
          </>}
        </section>

        <aside className="nava-analyst-ficha" aria-label="Detalle de la ficha">
          {selectedBrecha && activeBrecha && <BrechaPanel project={project} brechaKey={selectedBrecha} variant="analyst" onClose={() => selectBrecha(null)} />}
          {(!selectedBrecha || !activeBrecha) && <EmptyState title="Selecciona una ficha" detail="El detalle y sus campos editables aparecerán aquí." />}
        </aside>
      </div>
    </div>
  );
}
