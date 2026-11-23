import { getCriterionGroupSummary } from "../lib/aggregations";
import { getCriterionLabel } from "../lib/criterionLabels";
import { useProjectStore } from "../store/useProjectStore";
import type { Proyecto } from "../types";
import { MaterialIcon, StatusBadge } from "./ui/primitives";

function formatDate(value: string | null | undefined) {
  if (!value) return "Sin liberaciones registradas";
  return new Intl.DateTimeFormat("es-CL", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Santiago" }).format(new Date(value));
}

export function SeniorReview({ project }: { project: Proyecto }) {
  const releasePrinciple = useProjectStore((state) => state.releasePrinciple);
  const groups = getCriterionGroupSummary(project.evidencias, project.brechas, project);

  return <div className="nava-view nava-review-view">
    <header className="nava-page-heading">
      <div><p className="nava-eyebrow">Senior · Revisión</p><h1>Liberación al cliente</h1><p>Revisa el avance y libera cada principio como un bloque.</p></div>
      <span className="nava-review-demo-label"><MaterialIcon name="info" />Simulación local del demo</span>
    </header>
    <section className="nava-review-intro"><span className="nava-review-intro__icon"><MaterialIcon name="verified_user" /></span><div><strong>El cliente solo ve principios liberados</strong><p>Los cambios posteriores en un principio liberado vuelven a dejarlo pendiente de revisión.</p></div></section>
    <section className="nava-review-grid" aria-label="Principios por revisar">
      {groups.map((group) => {
        const release = project.liberacionesPrincipio?.[group.id];
        const isReleased = release?.liberado === true;
        const relationshipCount = group.detalles.reduce((count, detail) => count + detail.brechas.length, 0);
        return <article key={group.id} className={`nava-review-card${isReleased ? " is-released" : " is-pending"}`}>
          <div className="nava-review-card__heading"><div><span className="nava-review-card__code">P{group.id}</span><h2>{getCriterionLabel(group.id) || group.nombre}</h2></div><StatusBadge value={group.pctPromedio} /></div>
          <div className="nava-review-card__stats"><span><strong>{group.detalles.length}</strong> requisitos</span><span><strong>{relationshipCount}</strong> relaciones</span><span><strong>{group.brechasAbiertas}</strong> planes abiertos</span></div>
          <div className="nava-review-card__state"><MaterialIcon name={isReleased ? "check_circle" : "pending"} /><div><strong>{isReleased ? "Liberado al cliente" : "Pendiente de revisión"}</strong><small>{isReleased ? `${release.actor ?? "Senior (demo)"} · ${formatDate(release.fecha)}` : "El cliente no verá este principio."}</small></div></div>
          {!isReleased && <button type="button" className="nava-button nava-review-release" onClick={() => releasePrinciple(project.id, group.id)}><MaterialIcon name="publish" />Liberar P{group.id} al cliente</button>}
        </article>;
      })}
      {!groups.length && <div className="nava-review-empty"><MaterialIcon name="info" />Este proyecto no tiene principios con datos para revisar.</div>}
    </section>
  </div>;
}
