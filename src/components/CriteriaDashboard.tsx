import { useMemo, useState } from "react";
import { getCriterionGroupSummary } from "../lib/aggregations";
import { formatPct, getSemaphore } from "../lib/semaphore";
import { useProjectStore } from "../store/useProjectStore";
import { CriterioDetalleResumen, CriterioGrupoResumen, Proyecto } from "../types";

type DrillLevel = "groups" | "details" | "breaches";

function ringStyle(value: number | null) {
  const pct = value === null ? 0 : Math.round(value * 100);
  return {
    background: `conic-gradient(#39c66f ${pct * 3.6}deg, #e8eef2 0deg)`
  };
}

function getGroupLabel(groupId: string) {
  const labels: Record<string, string> = {
    "1": "Base de conocimiento",
    "2": "Personas y comunidades",
    "3": "Gobernanza",
    "4": "Responsabilidades",
    "5": "Gestion de riesgos",
    "6": "Mejora continua",
    "7": "Diseno tecnico",
    "8": "Operacion",
    "9": "Emergencias",
    "10": "Respuesta y preparacion",
    "11": "Revision y assurance",
    "12": "Cierre",
    "13": "Divulgacion",
    "14": "Trazabilidad",
    "15": "Aseguramiento externo"
  };
  return labels[groupId] ?? `Criterio ${groupId}`;
}

export function CriteriaDashboard({ project }: { project: Proyecto }) {
  const selectEvidence = useProjectStore((state) => state.selectEvidence);
  const groups = useMemo(() => getCriterionGroupSummary(project.evidencias, project.brechas), [project]);
  const [level, setLevel] = useState<DrillLevel>("groups");
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const activeGroup = groups.find((group) => group.id === activeGroupId) ?? null;
  const [activeDetailId, setActiveDetailId] = useState<string | null>(null);
  const activeDetail = activeGroup?.detalles.find((detail) => detail.id === activeDetailId) ?? null;

  function moveToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function selectGroup(group: CriterioGrupoResumen) {
    setActiveGroupId(group.id);
    setActiveDetailId(null);
    setLevel("details");
    moveToTop();
  }

  function selectDetail(detail: CriterioDetalleResumen) {
    setActiveDetailId(detail.id);
    setLevel("breaches");
    moveToTop();
  }

  function backToGroups() {
    setLevel("groups");
    setActiveGroupId(null);
    setActiveDetailId(null);
    moveToTop();
  }

  function backToDetails() {
    setLevel("details");
    setActiveDetailId(null);
    moveToTop();
  }

  return (
    <section className="criteria-dashboard">
      {level === "groups" && (
        <>
          <div className="section-heading">
            <div>
              <p className="eyebrow">Indicadores</p>
              <h2>Criterios GISTM 1-15</h2>
            </div>
            <span className="status-badge badge-gray">15 criterios</span>
          </div>
          <div className="criteria-grid">
            {groups.map((group) => (
              <CriterionGroupCard key={group.id} group={group} onClick={() => selectGroup(group)} />
            ))}
          </div>
        </>
      )}

      {level === "details" && activeGroup && (
        <section className="subcriteria-panel single-panel">
          <div className="navigation-strip">
            <button className="back-action" onClick={backToGroups}>← Criterios 1-15</button>
            <span>{activeGroup.nombre}</span>
          </div>
          <div className="panel-title">
            <div>
              <p className="eyebrow">Apertura</p>
              <h2>{activeGroup.nombre}: {getGroupLabel(activeGroup.id)}</h2>
            </div>
            <span className="status-badge badge-gray">{activeGroup.detalles.length} subcriterios</span>
          </div>

          <div className="subcriteria-grid">
            {activeGroup.detalles.map((detail) => (
              <SubcriterionButton key={detail.id} detail={detail} onClick={() => selectDetail(detail)} />
            ))}
          </div>
        </section>
      )}

      {level === "breaches" && activeGroup && activeDetail && (
        <section className="associated-panel single-panel">
          <div className="navigation-strip">
            <button className="back-action" onClick={backToDetails}>← {activeGroup.nombre}</button>
            <button className="back-action subtle" onClick={backToGroups}>Criterios 1-15</button>
          </div>
          <div className="panel-title">
            <div>
              <p className="eyebrow">Brechas asociadas</p>
              <h2>{activeDetail.id}</h2>
            </div>
            <span className="status-badge badge-gray">{activeDetail.brechas.length} brechas</span>
          </div>

          <div className="associated-list">
            {activeDetail.brechas.map((brecha) => {
              const evidencia = project.evidencias.find((item) => item.id === brecha.evidenciaId);
              const pct = typeof brecha.cumplimiento === "number" ? brecha.cumplimiento : null;
              const semaforo = getSemaphore(pct);
              const key = `${brecha.evidenciaId}-${brecha.criterio}`;
              if (!evidencia) return null;
              return (
                <button className="associated-card" key={key} onClick={() => selectEvidence(evidencia.id)}>
                  <span className={`phase-dot dot-${semaforo.estado}`} />
                  <span className="associated-main">
                    <strong>{brecha.criterio} · {evidencia.descripcion}</strong>
                    <small>
                      Evidencia {String(evidencia.id).padStart(2, "0")} · {evidencia.tipo} · {brecha.plan ?? "Sin plan"}
                      {brecha.responsableBrecha ? ` · ${brecha.responsableBrecha}` : ""}
                    </small>
                  </span>
                  <span className="associated-score">
                    <strong>{formatPct(pct)}</strong>
                    <small>{brecha.fechaCompromiso || semaforo.label}</small>
                  </span>
                  <span className="chevron">›</span>
                </button>
              );
            })}
          </div>
        </section>
      )}
    </section>
  );
}

function CriterionGroupCard({ group, onClick }: { group: CriterioGrupoResumen; onClick: () => void }) {
  const semaforo = getSemaphore(group.pctPromedio);

  return (
    <button className="criterion-group-card" onClick={onClick}>
      <span className={`phase-dot dot-${semaforo.estado}`} />
      <span className="criterion-code">C{group.id}</span>
      <span className="criterion-copy">
        <strong>{getGroupLabel(group.id)}</strong>
        <small>{group.detalles.length} subcriterios · {group.evidenciasCount} fichas</small>
      </span>
      <span className="ring-meter" style={ringStyle(group.pctPromedio)}>
        <span>{formatPct(group.pctPromedio)}</span>
      </span>
      <span className="metric-pair">
        <strong>{group.brechasAbiertas}</strong>
        <small>brechas</small>
      </span>
      <span className="chevron">›</span>
    </button>
  );
}

function SubcriterionButton({ detail, onClick }: { detail: CriterioDetalleResumen; onClick: () => void }) {
  const semaforo = getSemaphore(detail.pctPromedio);

  return (
    <button className="subcriterion-button" onClick={onClick}>
      <span className={`phase-dot dot-${semaforo.estado}`} />
      <span>
        <strong>{detail.id}</strong>
        <small>{detail.brechas.length} brechas · {detail.evidencias.length} fichas asociadas</small>
      </span>
      <span className="subcriterion-score">
        <strong>{formatPct(detail.pctPromedio)}</strong>
        <small>{detail.brechasAbiertas} brechas</small>
      </span>
    </button>
  );
}
