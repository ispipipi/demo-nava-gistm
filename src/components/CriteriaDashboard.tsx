import { useMemo, useState } from "react";
import { getAllCriteria, getCriterionDetail, getCriterionGroupSummary, getCriterionRoot } from "../lib/aggregations";
import { getCriterionLabel } from "../lib/criterionLabels";
import { getTopicForPrinciple, gistmTopics, requirementTexts } from "../lib/gistmCatalog";
import { formatPct, getSemaphore } from "../lib/semaphore";
import { useProjectStore } from "../store/useProjectStore";
import type { BrechaKey, Proyecto } from "../types";
import { BrechaPanel } from "./BrechaPanel";
import { Breadcrumbs, EmptyState, MaterialIcon } from "./ui/primitives";
import { RequirementCriteria } from "./RequirementCriteria";

export function CriteriaDashboard({ project, onOpenAnalyst }: {
  project: Proyecto;
  onOpenAnalyst: (criterion: string, subcriterion?: string | null, brecha?: BrechaKey) => void;
}) {
  const analystCriterion = useProjectStore((state) => state.analystCriterion);
  const analystSubcriterion = useProjectStore((state) => state.analystSubcriterion);
  const selectedBrecha = useProjectStore((state) => state.selectedBrecha);
  const setAnalystLocation = useProjectStore((state) => state.setAnalystLocation);
  const selectBrecha = useProjectStore((state) => state.selectBrecha);
  const groups = useMemo(() => getCriterionGroupSummary(project.evidencias, project.brechas, project), [project]);
  const principleScope = project.principiosActivos?.length
    ? `Principios ${project.principiosActivos[0]}–${project.principiosActivos[project.principiosActivos.length - 1]}`
    : "Principios 1–15";
  const activeGroup = groups.find((item) => item.id === analystCriterion) ?? null;
  const activeDetail = activeGroup?.detalles.find((item) => item.id === analystSubcriterion) ?? null;
  const activeBrecha = selectedBrecha ? project.brechas.find((item) => item && item.evidenciaId === selectedBrecha.evidenciaId && item.criterio === selectedBrecha.criterio) : null;
  const activeEvidence = activeBrecha ? project.evidencias.find((item) => item.id === activeBrecha.evidenciaId) : null;
  const [topicFilter, setTopicFilter] = useState("todos");
  const activeTopic = activeGroup ? getTopicForPrinciple(activeGroup.id) : null;
  const availableTopics = gistmTopics.filter((topic) => groups.some((group) => topic.principles.includes(group.id)));
  const filteredGroups = groups.filter((group) => topicFilter === "todos" || getTopicForPrinciple(group.id)?.id === topicFilter);

  function selectGroup(groupId: string) {
    const group = groups.find((item) => item.id === groupId);
    if (!group) return;
    if (analystCriterion === groupId) {
      setAnalystLocation(null, null);
      selectBrecha(null);
      return;
    }
    setAnalystLocation(groupId, null);
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
    <div className={`nava-view nava-analyst${activeGroup ? " has-detail" : ""}${selectedBrecha ? " has-brecha" : ""}`}>
      <div className="nava-analyst-heading">
        <div><p className="nava-eyebrow">Trabajo · Edición</p><h1>Revisión de criterios y evidencias</h1></div>
        <span className="nava-count-pill">{project.brechas.length} relaciones</span>
      </div>
      <Breadcrumbs items={[
        { label: principleScope, onClick: () => { setAnalystLocation(null, null); selectBrecha(null); } },
        ...(activeTopic ? [{ label: `Tema ${activeTopic.id}`, onClick: () => { setTopicFilter(activeTopic.id); setAnalystLocation(null, null); selectBrecha(null); } }] : []),
        ...(activeGroup ? [{ label: `Principle ${activeGroup.id}`, onClick: () => { setAnalystLocation(activeGroup.id, null); selectBrecha(null); } }] : []),
        ...(activeDetail ? [{ label: `Requirement ${activeDetail.id}`, onClick: () => selectBrecha(null) }] : []),
        ...(activeBrecha ? [{ label: `Criterio NAVA ${activeBrecha.criterio}`, onClick: () => selectBrecha(null) }] : []),
        ...(activeBrecha && activeEvidence ? [{ label: `E${String(activeEvidence.id).padStart(2, "0")}` }] : [])
      ]} />
      <label className="nava-select-label gistm-topic-filter">Tema<select aria-label="Filtrar principios por tema" value={topicFilter} onChange={(event) => { setTopicFilter(event.target.value); setAnalystLocation(null, null); selectBrecha(null); }}><option value="todos">Todos los temas del proyecto</option>{availableTopics.map((topic) => <option key={topic.id} value={topic.id}>{topic.id} · {topic.name}</option>)}</select></label>
      <div className="nava-analyst-grid">
        <aside className="nava-criteria-master" aria-label={principleScope}>
          <div className="nava-analyst-panel-heading"><div><p className="nava-eyebrow">Matriz GISTM</p><h2>{principleScope}</h2></div><span>{groups.length}</span></div>
          <div className="nava-criteria-accordion">
            {filteredGroups.map((group) => {
              const expanded = activeGroup?.id === group.id;
              const status = getSemaphore(group.pctPromedio);
              return <section className={`nava-criteria-group${expanded ? " is-expanded" : ""}`} key={group.id}>
                <button type="button" className="nava-criteria-group__trigger" aria-expanded={expanded} onClick={() => selectGroup(group.id)}>
                  <MaterialIcon name={expanded ? "expand_more" : "chevron_right"} />
                  <span className="nava-criteria-group__copy"><span><b>P{group.id}</b><strong lang="en">{getCriterionLabel(group.id)}</strong></span><small>{group.detalles.length} requisitos · {group.brechasAbiertas} relaciones abiertas</small></span>
                  <span className="nava-criteria-group__score" style={{ color: status.fg }}><MaterialIcon name={status.icon} />{formatPct(group.pctPromedio)}</span>
                </button>
                {expanded && <div className="nava-criteria-sublist">{group.detalles.map((detail) => { const criterionCount = new Set([...getAllCriteria(detail.brechas), ...(project.criteriosNava ?? []).filter((criterion) => getCriterionDetail(criterion) === detail.id)]).size; return <button key={detail.id} type="button" className={analystSubcriterion === detail.id ? "is-selected" : ""} aria-current={analystSubcriterion === detail.id ? "true" : undefined} onClick={() => selectSubcriterion(detail.id)}><span className="nava-mono">{detail.id}</span><span><strong>{criterionCount} criterios</strong><small>{detail.evidencias.length} evidencias</small></span><b>{formatPct(detail.pctPromedio)}</b></button>; })}</div>}
              </section>;
            })}
          </div>
        </aside>

        <section className="nava-criteria-detail" aria-label="Requisitos y criterios NAVA">
          {!activeGroup ? <EmptyState title="Elige un principio" detail={`${groups.length} principios disponibles en el proyecto.`} /> : !activeDetail ? <div className="nava-detail-intro"><p className="nava-eyebrow">Principle {activeGroup.id}</p><h2 lang="en">{getCriterionLabel(activeGroup.id)}</h2><div className="nava-subcriterion-choices">{activeGroup.detalles.map((detail) => <button key={detail.id} type="button" onClick={() => selectSubcriterion(detail.id)}><span className="nava-mono">Requirement {detail.id}</span><strong>{getAllCriteria(detail.brechas).length} criterios</strong><MaterialIcon name="chevron_right" /></button>)}</div></div> : <>
            <div className="nava-detail-header"><button className="nava-mobile-back" type="button" onClick={() => { setAnalystLocation(activeGroup.id, null); selectBrecha(null); }}><MaterialIcon name="arrow_back" />Requisitos</button><div><p className="nava-eyebrow">Principle {activeGroup.id} · Tema {activeTopic?.id}</p><h2>Requirement {activeDetail.id}</h2></div><span className="nava-count-pill">{activeDetail.brechas.length} relaciones</span></div>
            {requirementTexts[activeDetail.id] && <details className="gistm-source-text"><summary lang="en">Requirement {activeDetail.id} · GISTM</summary><p lang="en">{requirementTexts[activeDetail.id]}</p></details>}
            <div className="nava-subcriterion-tabs" role="group" aria-label={`Requisitos del principio ${activeGroup.id}`}>{activeGroup.detalles.map((detail) => <button key={detail.id} type="button" className={analystSubcriterion === detail.id ? "is-active" : ""} aria-pressed={analystSubcriterion === detail.id} onClick={() => selectSubcriterion(detail.id)}><span className="nava-mono">{detail.id}</span><small>{formatPct(detail.pctPromedio)}</small></button>)}</div>
            <RequirementCriteria key={activeDetail.id} detail={activeDetail} project={project} selectedBrecha={selectedBrecha} onOpen={openBrecha} onClear={() => selectBrecha(null)} />
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
