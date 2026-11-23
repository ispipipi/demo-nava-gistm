import { useState } from "react";
import { averageCumplimiento, getCriterionGroupSummary } from "../lib/aggregations";
import { getCriterionLabel } from "../lib/criterionLabels";
import { gistmTopics } from "../lib/gistmCatalog";
import { formatPct } from "../lib/semaphore";
import { Breadcrumbs, MaterialIcon, StatusBadge } from "./ui/primitives";

export function GistmTopicExplorer({ groups, onOpenPrinciple }: {
  groups: ReturnType<typeof getCriterionGroupSummary>;
  onOpenPrinciple: (id: string) => void;
}) {
  const [topicId, setTopicId] = useState<string | null>(null);
  const activeTopic = gistmTopics.find((topic) => topic.id === topicId);
  const loaded = groups.filter((group) => group.detalles.length > 0);
  const visibleGroups = loaded.filter((group) => activeTopic?.principles.includes(group.id));

  return <section className="nava-section gistm-explorer" aria-label="Temas GISTM">
    <div className="nava-section-heading"><div><h2>{activeTopic ? activeTopic.name : "Temas GISTM"}</h2><p>{activeTopic ? `Tema ${activeTopic.id} · ${visibleGroups.length} de ${activeTopic.principles.length} principios con datos` : `${loaded.length} de 15 principios con datos en el proyecto`}</p></div></div>
    <Breadcrumbs items={[
      { label: "Temas", onClick: () => setTopicId(null) },
      ...(activeTopic ? [{ label: `Tema ${activeTopic.id}` }] : [])
    ]} />
    {!activeTopic ? <div className="gistm-topic-grid">{gistmTopics.map((topic) => {
      const topicGroups = loaded.filter((group) => topic.principles.includes(group.id));
      const pct = averageCumplimiento(topicGroups.map((group) => group.pctPromedio));
      return <button key={topic.id} type="button" className="gistm-topic-card" onClick={() => setTopicId(topic.id)} aria-label={`Tema ${topic.id}: ${topic.name}`}>
        <span className="gistm-topic-card__code">Tema {topic.id}<MaterialIcon name="chevron_right" /></span>
        <strong lang="en">{topic.name}</strong>
        <span className="gistm-topic-card__stats"><span>{topicGroups.length} / {topic.principles.length} principios cargados</span>{topicGroups.length ? <StatusBadge value={pct} label={formatPct(pct)} /> : <span>Sin datos</span>}</span>
      </button>;
    })}</div> : <div className="gistm-principle-list">{activeTopic.principles.map((id) => {
      const group = visibleGroups.find((item) => item.id === id);
      return <button key={id} type="button" disabled={!group} className="gistm-principle-card" onClick={() => onOpenPrinciple(id)}>
        <span className="gistm-principle-card__code">P{id}</span><span className="gistm-principle-card__copy"><strong lang="en">{getCriterionLabel(id)}</strong><small>{group ? `${group.detalles.length} requisitos · ${group.brechasAbiertas} relaciones abiertas` : "Sin datos cargados"}</small></span>
        {group && <><StatusBadge value={group.pctPromedio} label={formatPct(group.pctPromedio)} /><MaterialIcon name="chevron_right" /></>}
      </button>;
    })}</div>}
  </section>;
}
